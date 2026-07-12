import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, resetDbSingleton } from "./client";
import { upsertRating } from "./repository";

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
});
