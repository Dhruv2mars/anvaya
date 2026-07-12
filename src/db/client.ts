import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "@/src/db/schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

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

/** Test helper — reset singleton between tests. */
export function resetDbSingleton(): void {
  dbPromise = null;
}
