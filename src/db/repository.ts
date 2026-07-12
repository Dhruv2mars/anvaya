import { nanoid } from "nanoid/non-secure";
import { getDb } from "@/src/db/client";
import type { DayRecord, Metric, PanchangSnapshot, Rating } from "@/src/domain/types";

type MetricRow = {
  id: string;
  name: string;
  sort_order: number;
  archived_at: number | null;
  created_at: number;
};

type RatingRow = {
  id: string;
  day_key: string;
  metric_id: string;
  value: number;
  updated_at: number;
};

type DayRow = {
  day_key: string;
  note: string;
  note_updated_at: number | null;
  tithi: string | null;
  vaar: string | null;
  paksha: string | null;
  nakshatra: string | null;
  masa: string | null;
  sunrise_iso: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: number;
};

function mapMetric(row: MetricRow): Metric {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function mapRating(row: RatingRow): Rating {
  return {
    id: row.id,
    dayKey: row.day_key,
    metricId: row.metric_id,
    value: row.value,
    updatedAt: row.updated_at,
  };
}

function mapDay(row: DayRow): DayRecord {
  return {
    dayKey: row.day_key,
    note: row.note,
    noteUpdatedAt: row.note_updated_at,
    tithi: row.tithi,
    vaar: row.vaar,
    paksha: row.paksha,
    nakshatra: row.nakshatra,
    masa: row.masa,
    sunriseIso: row.sunrise_iso,
    latitude: row.latitude,
    longitude: row.longitude,
    updatedAt: row.updated_at,
  };
}

export async function listActiveMetrics(): Promise<Metric[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MetricRow>(
    `SELECT * FROM metrics WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC`
  );
  return rows.map(mapMetric);
}

export async function listAllMetrics(): Promise<Metric[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MetricRow>(
    `SELECT * FROM metrics ORDER BY archived_at IS NOT NULL, sort_order ASC, created_at ASC`
  );
  return rows.map(mapMetric);
}

export async function createMetric(name: string): Promise<Metric> {
  const db = await getDb();
  const max = await db.getFirstAsync<{ m: number | null }>(
    `SELECT MAX(sort_order) as m FROM metrics WHERE archived_at IS NULL`
  );
  const sortOrder = (max?.m ?? -1) + 1;
  const metric: Metric = {
    id: nanoid(),
    name: name.trim(),
    sortOrder,
    archivedAt: null,
    createdAt: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO metrics (id, name, sort_order, archived_at, created_at) VALUES (?, ?, ?, NULL, ?)`,
    metric.id,
    metric.name,
    metric.sortOrder,
    metric.createdAt
  );
  return metric;
}

export async function renameMetric(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE metrics SET name = ? WHERE id = ?`, name.trim(), id);
}

export async function archiveMetric(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE metrics SET archived_at = ? WHERE id = ?`, Date.now(), id);
}

export async function restoreMetric(id: string): Promise<void> {
  const db = await getDb();
  const max = await db.getFirstAsync<{ m: number | null }>(
    `SELECT MAX(sort_order) as m FROM metrics WHERE archived_at IS NULL`
  );
  const sortOrder = (max?.m ?? -1) + 1;
  await db.runAsync(
    `UPDATE metrics SET archived_at = NULL, sort_order = ? WHERE id = ?`,
    sortOrder,
    id
  );
}

export async function reorderMetrics(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      await db.runAsync(`UPDATE metrics SET sort_order = ? WHERE id = ?`, i, id);
    }
  });
}

export async function getDay(dayKey: string): Promise<DayRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DayRow>(`SELECT * FROM days WHERE day_key = ?`, dayKey);
  return row ? mapDay(row) : null;
}

export async function upsertDayPanchang(snapshot: PanchangSnapshot): Promise<DayRecord> {
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
}

export async function setDayNote(dayKey: string, note: string): Promise<string> {
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
}

export async function getRatingsForDay(dayKey: string): Promise<Rating[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RatingRow>(
    `SELECT * FROM ratings WHERE day_key = ?`,
    dayKey
  );
  return rows.map(mapRating);
}

export async function upsertRating(
  dayKey: string,
  metricId: string,
  value: number
): Promise<Rating> {
  if (value < 1 || value > 5 || !Number.isInteger(value)) {
    throw new Error("Rating must be an integer from 1 to 5");
  }
  const db = await getDb();
  const now = Date.now();
  let rating: Rating = {
    id: nanoid(),
    dayKey,
    metricId,
    value,
    updatedAt: now,
  };

  await db.withExclusiveTransactionAsync(async (txn) => {
    // History joins ratings through days, so both rows must commit or roll back together.
    await txn.runAsync(
      `INSERT INTO days (day_key, note, updated_at) VALUES (?, '', ?)
       ON CONFLICT(day_key) DO NOTHING`,
      dayKey,
      now
    );

    const existing = await txn.getFirstAsync<RatingRow>(
      `SELECT * FROM ratings WHERE day_key = ? AND metric_id = ?`,
      dayKey,
      metricId
    );
    if (existing) {
      await txn.runAsync(
        `UPDATE ratings SET value=?, updated_at=? WHERE id=?`,
        value,
        now,
        existing.id
      );
      rating = { ...mapRating(existing), value, updatedAt: now };
      return;
    }

    await txn.runAsync(
      `INSERT INTO ratings (id, day_key, metric_id, value, updated_at) VALUES (?, ?, ?, ?, ?)`,
      rating.id,
      rating.dayKey,
      rating.metricId,
      rating.value,
      rating.updatedAt
    );
  });

  return rating;
}

export async function clearRating(dayKey: string, metricId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ratings WHERE day_key = ? AND metric_id = ?`, dayKey, metricId);
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

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

export async function getAllRatingsForMetric(metricId: string): Promise<Rating[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RatingRow>(
    `SELECT * FROM ratings WHERE metric_id = ? ORDER BY day_key ASC`,
    metricId
  );
  return rows.map(mapRating);
}

export async function getRecentRatings(limitDays = 30): Promise<Rating[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RatingRow>(
    `SELECT * FROM ratings ORDER BY day_key DESC`
  );
  if (rows.length === 0) return [];
  const newest = rows[0]!.day_key;
  const [y, m, d] = newest.split("-").map(Number);
  const cutoffDate = new Date(y!, m! - 1, d!);
  cutoffDate.setDate(cutoffDate.getDate() - limitDays);
  const cy = cutoffDate.getFullYear();
  const cm = String(cutoffDate.getMonth() + 1).padStart(2, "0");
  const cd = String(cutoffDate.getDate()).padStart(2, "0");
  const cutoff = `${cy}-${cm}-${cd}`;
  return rows.filter((r) => r.day_key >= cutoff).map(mapRating);
}
