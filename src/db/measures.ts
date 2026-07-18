import { nanoid } from "nanoid/non-secure";
import { getDb, runDbWrite } from "@/src/db/client";
import { mapMeasure, type MeasureRow } from "@/src/db/rows";
import type { Measure } from "@/src/domain/types";
import {
  decodeOnboarded,
  encodeOnboarded,
  settingsKeys,
} from "@/src/settings/settings";

export async function listActiveMeasures(): Promise<Measure[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MeasureRow>(
    `SELECT * FROM metrics WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC`
  );
  return rows.map(mapMeasure);
}

export async function listAllMeasures(): Promise<Measure[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MeasureRow>(
    `SELECT * FROM metrics ORDER BY archived_at IS NOT NULL, sort_order ASC, created_at ASC`
  );
  return rows.map(mapMeasure);
}

/** First-run: seed measures and mark onboarding complete in one transaction. */
export function completeOnboardingSetup(measureNames: string[]): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const completed = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        settingsKeys.onboardingComplete
      );
      if (decodeOnboarded(completed?.value ?? null)) return;

      const max = await db.getFirstAsync<{ m: number | null }>(
        `SELECT MAX(sort_order) as m FROM metrics WHERE archived_at IS NULL`
      );
      let sortOrder = (max?.m ?? -1) + 1;
      const now = Date.now();
      for (const name of measureNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        await db.runAsync(
          `INSERT INTO metrics (id, name, sort_order, archived_at, created_at) VALUES (?, ?, ?, NULL, ?)`,
          nanoid(),
          trimmed,
          sortOrder++,
          now
        );
      }
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        settingsKeys.onboardingComplete,
        encodeOnboarded(true)
      );
    });
  });
}

export function createMeasure(name: string): Promise<Measure> {
  return runDbWrite(async () => {
    const db = await getDb();
    const max = await db.getFirstAsync<{ m: number | null }>(
      `SELECT MAX(sort_order) as m FROM metrics WHERE archived_at IS NULL`
    );
    const sortOrder = (max?.m ?? -1) + 1;
    const measure: Measure = {
      id: nanoid(),
      name: name.trim(),
      sortOrder,
      archivedAt: null,
      createdAt: Date.now(),
    };
    await db.runAsync(
      `INSERT INTO metrics (id, name, sort_order, archived_at, created_at) VALUES (?, ?, ?, NULL, ?)`,
      measure.id,
      measure.name,
      measure.sortOrder,
      measure.createdAt
    );
    return measure;
  });
}

export function renameMeasure(id: string, name: string): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.runAsync(`UPDATE metrics SET name = ? WHERE id = ?`, name.trim(), id);
  });
}

export function archiveMeasure(id: string): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.runAsync(`UPDATE metrics SET archived_at = ? WHERE id = ?`, Date.now(), id);
  });
}

export function deleteArchivedMeasure(id: string): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const measure = await db.getFirstAsync<{ archived_at: number | null }>(
        `SELECT archived_at FROM metrics WHERE id = ?`,
        id
      );
      if (!measure) throw new Error("Measure not found");
      if (measure.archived_at == null) {
        throw new Error("Archive a measure before deleting it");
      }

      await db.runAsync(`DELETE FROM ratings WHERE metric_id = ?`, id);
      await db.runAsync(`DELETE FROM metrics WHERE id = ?`, id);
    });
  });
}

export function restoreMeasure(id: string): Promise<void> {
  return runDbWrite(async () => {
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
  });
}

export function reorderMeasures(orderedIds: string[]): Promise<void> {
  return runDbWrite(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (!id) continue;
        await db.runAsync(`UPDATE metrics SET sort_order = ? WHERE id = ?`, i, id);
      }
    });
  });
}
