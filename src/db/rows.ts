import type { DayRecord, Measure, Rating } from "@/src/domain/types";

/** SQLite row shapes — table names stay legacy (`metrics` / `metric_id`). */

export type MeasureRow = {
  id: string;
  name: string;
  sort_order: number;
  archived_at: number | null;
  created_at: number;
};

export type RatingRow = {
  id: string;
  day_key: string;
  metric_id: string;
  value: number;
  updated_at: number;
};

export type DayRow = {
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

export function mapMeasure(row: MeasureRow): Measure {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

export function mapRating(row: RatingRow): Rating {
  return {
    id: row.id,
    dayKey: row.day_key,
    measureId: row.metric_id,
    value: row.value,
    updatedAt: row.updated_at,
  };
}

export function mapDay(row: DayRow): DayRecord {
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
