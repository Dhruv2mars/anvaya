import { getDb, runDbWrite } from "@/src/db/client";

/** Raw settings KV — typed App settings live in `src/settings`. */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  });
}
