import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, resetDbSingleton } from "./client";
import {
  completeOnboardingSetup,
  deleteArchivedMeasure,
} from "./measures";
import { setDayNote } from "./days";
import { upsertRating } from "./ratings";

const sqlite = vi.hoisted(() => ({
  openDatabaseAsync: vi.fn(),
}));

vi.mock("expo-sqlite", () => sqlite);

const transaction = {
  getFirstAsync: vi.fn(),
  runAsync: vi.fn(),
};

const database = {
  execAsync: vi.fn(),
  getFirstAsync: vi.fn(),
  runAsync: vi.fn(),
  withTransactionAsync: vi.fn(),
  withExclusiveTransactionAsync: vi.fn(),
};

beforeEach(() => {
  resetDbSingleton();
  vi.clearAllMocks();
  sqlite.openDatabaseAsync.mockResolvedValue(database);
  database.execAsync.mockResolvedValue(undefined);
  transaction.getFirstAsync.mockResolvedValue(null);
  transaction.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
  database.withTransactionAsync.mockImplementation(
    async (task: (txn: typeof transaction) => Promise<void>) => task(transaction)
  );
  database.withExclusiveTransactionAsync.mockImplementation(
    async (task: (txn: typeof transaction) => Promise<void>) => task(transaction)
  );
});

describe("database initialization", () => {
  it("retries after an initialization failure", async () => {
    sqlite.openDatabaseAsync.mockRejectedValueOnce(new Error("temporary native failure"));

    await expect(getDb()).rejects.toThrow("temporary native failure");
    await expect(getDb()).resolves.toBe(database);

    expect(sqlite.openDatabaseAsync).toHaveBeenCalledTimes(2);
  });
});

describe("upsertRating", () => {
  it("creates its day row and rating inside one exclusive transaction", async () => {
    await upsertRating("2026-07-12", "energy", 4);

    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO days"),
      "2026-07-12",
      expect.any(Number)
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO ratings"),
      expect.any(String),
      "2026-07-12",
      "energy",
      4,
      expect.any(Number)
    );
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("updates an existing rating inside the exclusive transaction", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({
      id: "existing-id",
      day_key: "2026-07-12",
      metric_id: "energy",
      value: 3,
      updated_at: 1000,
    });

    const result = await upsertRating("2026-07-12", "energy", 4);

    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE ratings"),
      4,
      expect.any(Number),
      "existing-id"
    );
    expect(result).toEqual({
      id: "existing-id",
      dayKey: "2026-07-12",
      measureId: "energy",
      value: 4,
      updatedAt: expect.any(Number),
    });
  });

  it("finishes a rating transaction before starting a concurrent note write", async () => {
    let releaseTransaction!: () => void;
    const transactionGate = new Promise<void>((resolve) => {
      releaseTransaction = resolve;
    });
    database.withExclusiveTransactionAsync.mockImplementationOnce(
      async (task: (txn: typeof transaction) => Promise<void>) => {
        await task(transaction);
        await transactionGate;
      }
    );
    database.getFirstAsync.mockResolvedValue(null);
    database.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    const ratingWrite = upsertRating("2026-07-12", "energy", 5);
    await vi.waitFor(() => expect(database.withExclusiveTransactionAsync).toHaveBeenCalledOnce());

    const noteWrite = setDayNote("2026-07-12", "Good day");
    await Promise.resolve();

    expect(database.getFirstAsync).not.toHaveBeenCalled();
    expect(database.runAsync).not.toHaveBeenCalled();

    releaseTransaction();
    await Promise.all([ratingWrite, noteWrite]);

    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM days"),
      "2026-07-12"
    );
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO days"),
      "2026-07-12",
      "Good day",
      expect.any(Number),
      expect.any(Number)
    );
  });
});

describe("completeOnboardingSetup", () => {
  it("persists initial metrics and completion in one transaction", async () => {
    transaction.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ m: null });

    await completeOnboardingSetup(["Energy", "Focus"]);

    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(transaction.runAsync).toHaveBeenCalledTimes(3);
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO metrics"),
      expect.any(String),
      "Energy",
      0,
      expect.any(Number)
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO metrics"),
      expect.any(String),
      "Focus",
      1,
      expect.any(Number)
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO settings"),
      "onboarding_complete",
      "1"
    );
  });

  it("retries the full transaction after an interrupted setup", async () => {
    transaction.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ m: null })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ m: null });
    transaction.runAsync
      .mockRejectedValueOnce(new Error("interrupted write"))
      .mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    await expect(completeOnboardingSetup(["Energy", "Focus"])).rejects.toThrow(
      "interrupted write"
    );
    await completeOnboardingSetup(["Energy", "Focus"]);

    expect(transaction.runAsync).toHaveBeenCalledTimes(4);
    expect(transaction.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO settings"),
      "onboarding_complete",
      "1"
    );
  });

  it("does not duplicate metrics when a completed setup is retried", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({ value: "1" });

    await completeOnboardingSetup(["Energy", "Focus"]);

    expect(transaction.runAsync).not.toHaveBeenCalled();
  });
});

describe("deleteArchivedMeasure", () => {
  it("deletes an archived measure and all of its ratings in one transaction", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({ archived_at: 1234 });

    await deleteArchivedMeasure("energy");

    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("DELETE FROM ratings"),
      "energy"
    );
    expect(transaction.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM metrics"),
      "energy"
    );
  });

  it("refuses to delete an active measure or its ratings", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({ archived_at: null });

    await expect(deleteArchivedMeasure("energy")).rejects.toThrow(
      "Archive a measure before deleting it"
    );
    expect(transaction.runAsync).not.toHaveBeenCalled();
  });

  it("refuses to delete a missing measure", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce(null);

    await expect(deleteArchivedMeasure("missing")).rejects.toThrow("Measure not found");
    expect(transaction.runAsync).not.toHaveBeenCalled();
  });
});
