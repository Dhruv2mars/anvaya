import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, resetDbSingleton } from "./client";
import {
  completeOnboardingSetup,
  deleteArchivedMetric,
  setDayNote,
  upsertRating,
} from "./repository";

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
      metricId: "energy",
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
    database.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ m: null });

    await completeOnboardingSetup(["Energy", "Focus"]);

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledTimes(3);
    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO metrics"),
      expect.any(String),
      "Energy",
      0,
      expect.any(Number)
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO metrics"),
      expect.any(String),
      "Focus",
      1,
      expect.any(Number)
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO settings"),
      "onboarding_complete",
      "1"
    );
  });

  it("does not duplicate metrics when an interrupted setup is retried", async () => {
    database.getFirstAsync.mockResolvedValueOnce({ value: "1" });

    await completeOnboardingSetup(["Energy", "Focus"]);

    expect(database.runAsync).not.toHaveBeenCalled();
  });
});

describe("deleteArchivedMetric", () => {
  it("deletes an archived metric and all of its ratings in one transaction", async () => {
    database.getFirstAsync.mockResolvedValueOnce({ archived_at: 1234 });

    await deleteArchivedMetric("energy");

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("DELETE FROM ratings"),
      "energy"
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM metrics"),
      "energy"
    );
  });

  it("refuses to delete an active metric or its ratings", async () => {
    database.getFirstAsync.mockResolvedValueOnce({ archived_at: null });

    await expect(deleteArchivedMetric("energy")).rejects.toThrow(
      "Archive a metric before deleting it"
    );
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("refuses to delete a missing metric", async () => {
    database.getFirstAsync.mockResolvedValueOnce(null);

    await expect(deleteArchivedMetric("missing")).rejects.toThrow("Metric not found");
    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
