import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "@/src/db/schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("anvaya.db");
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
  }
  return dbPromise;
}

/** Test helper — reset singleton between tests. */
export function resetDbSingleton(): void {
  dbPromise = null;
}
