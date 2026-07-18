import { nanoid } from "nanoid/non-secure";
import { getDb, runDbWrite } from "@/src/db/client";
import { mapRating, type RatingRow } from "@/src/db/rows";
import type { Rating } from "@/src/domain/types";

export async function getRatingsForDay(dayKey: string): Promise<Rating[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RatingRow>(
    `SELECT * FROM ratings WHERE day_key = ?`,
    dayKey
  );
  return rows.map(mapRating);
}

export function upsertRating(
  dayKey: string,
  measureId: string,
  value: number
): Promise<Rating> {
  if (value < 1 || value > 5 || !Number.isInteger(value)) {
    return Promise.reject(new Error("Rating must be an integer from 1 to 5"));
  }

  return runDbWrite(async () => {
    const db = await getDb();
    const now = Date.now();
    let rating: Rating = {
      id: nanoid(),
      dayKey,
      measureId,
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
        measureId
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
        rating.measureId,
        rating.value,
        rating.updatedAt
      );
    });

    return rating;
  });
}

export function clearRating(dayKey: string, measureId: string): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.runAsync(
      `DELETE FROM ratings WHERE day_key = ? AND metric_id = ?`,
      dayKey,
      measureId
    );
  });
}

export async function getAllRatingsForMeasure(measureId: string): Promise<Rating[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RatingRow>(
    `SELECT * FROM ratings WHERE metric_id = ? ORDER BY day_key ASC`,
    measureId
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
