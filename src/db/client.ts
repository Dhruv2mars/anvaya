import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "@/src/db/schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    const opening = (async () => {
      const db = await SQLite.openDatabaseAsync("anvaya.db");
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
    dbPromise = opening.catch((error: unknown) => {
      // A transient native/database failure must not poison the session forever.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/** Serialize mutations so native SQLite statements never compete for the same connection. */
export function runDbWrite<T>(task: () => Promise<T>): Promise<T> {
  const operation = writeQueue.then(task);
  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );
  return operation;
}

/** Test helper — reset singleton between tests. */
export function resetDbSingleton(): void {
  dbPromise = null;
  writeQueue = Promise.resolve();
}
