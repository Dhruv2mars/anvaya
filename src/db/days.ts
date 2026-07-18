import { getDb, runDbWrite } from "@/src/db/client";
import { mapDay, type DayRow } from "@/src/db/rows";
import type { DayRecord, PanchangSnapshot } from "@/src/domain/types";

export async function getDay(dayKey: string): Promise<DayRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DayRow>(`SELECT * FROM days WHERE day_key = ?`, dayKey);
  return row ? mapDay(row) : null;
}

export function upsertDayPanchang(snapshot: PanchangSnapshot): Promise<DayRecord> {
  return runDbWrite(async () => {
    const db = await getDb();
    const existing = await getDay(snapshot.dayKey);
    const now = Date.now();
    if (existing) {
      await db.runAsync(
        `UPDATE days SET tithi=?, vaar=?, paksha=?, nakshatra=?, masa=?, sunrise_iso=?, latitude=?, longitude=?, updated_at=? WHERE day_key=?`,
        snapshot.tithi,
        snapshot.vaar,
        snapshot.paksha,
        snapshot.nakshatra,
        snapshot.masa,
        snapshot.sunrise.toISOString(),
        snapshot.latitude,
        snapshot.longitude,
        now,
        snapshot.dayKey
      );
    } else {
      await db.runAsync(
        `INSERT INTO days (day_key, note, note_updated_at, tithi, vaar, paksha, nakshatra, masa, sunrise_iso, latitude, longitude, updated_at)
         VALUES (?, '', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        snapshot.dayKey,
        snapshot.tithi,
        snapshot.vaar,
        snapshot.paksha,
        snapshot.nakshatra,
        snapshot.masa,
        snapshot.sunrise.toISOString(),
        snapshot.latitude,
        snapshot.longitude,
        now
      );
    }
    return (await getDay(snapshot.dayKey))!;
  });
}

export function setDayNote(dayKey: string, note: string): Promise<string> {
  return runDbWrite(async () => {
    const db = await getDb();
    const existing = await getDay(dayKey);
    const now = Date.now();
    const trimmed = note.slice(0, 280);
    if (existing) {
      await db.runAsync(
        `UPDATE days SET note=?, note_updated_at=?, updated_at=? WHERE day_key=?`,
        trimmed,
        now,
        now,
        dayKey
      );
    } else {
      await db.runAsync(
        `INSERT INTO days (day_key, note, note_updated_at, updated_at) VALUES (?, ?, ?, ?)`,
        dayKey,
        trimmed,
        now,
        now
      );
    }
    return trimmed;
  });
}

export async function listDaysWithActivity(limit = 90): Promise<DayRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DayRow>(
    `SELECT d.* FROM days d
     WHERE d.note != '' OR EXISTS (SELECT 1 FROM ratings r WHERE r.day_key = d.day_key)
     ORDER BY d.day_key DESC
     LIMIT ?`,
    limit
  );
  return rows.map(mapDay);
}
