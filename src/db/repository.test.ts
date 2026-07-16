import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, resetDbSingleton } from "./client";
import { deleteArchivedMetric, setDayNote, upsertRating } from "./repository";

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
  withExclusiveTransactionAsync: vi.fn(),
};

beforeEach(() => {
  resetDbSingleton();
  vi.clearAllMocks();
  sqlite.openDatabaseAsync.mockResolvedValue(database);
  database.execAsync.mockResolvedValue(undefined);
  transaction.getFirstAsync.mockResolvedValue(null);
  transaction.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
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

describe("deleteArchivedMetric", () => {
  it("deletes an archived metric and all of its ratings in one transaction", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({
      id: "energy",
      name: "Energy",
      sort_order: 0,
      archived_at: 1234,
      created_at: 1000,
    });

    await deleteArchivedMetric("energy");

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
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("refuses to delete an active metric or its ratings", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce({
      id: "energy",
      name: "Energy",
      sort_order: 0,
      archived_at: null,
      created_at: 1000,
    });

    await expect(deleteArchivedMetric("energy")).rejects.toThrow(
      "Archive a metric before deleting it"
    );
    expect(transaction.runAsync).not.toHaveBeenCalled();
  });

  it("refuses to delete a missing metric", async () => {
    transaction.getFirstAsync.mockResolvedValueOnce(null);

    await expect(deleteArchivedMetric("missing")).rejects.toThrow("Metric not found");
    expect(transaction.runAsync).not.toHaveBeenCalled();
  });
});
