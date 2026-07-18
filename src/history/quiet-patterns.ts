import { shiftDayKey } from "@/src/domain/day-key";
import type { Measure, Rating } from "@/src/domain/types";

/** Quiet pattern summary for one measure over recent ratings. */
export type MeasureStats = {
  measureId: string;
  measureName: string;
  count: number;
  average: number;
  last7Average: number | null;
  streak: number; // consecutive days with any rating ending at latest day
};

/**
 * Compute quiet patterns for the History screen.
 * Owns streak / last-7 / average policy — callers pass catalog + ratings + today.
 */
export function computeMeasureStats(
  measures: Measure[],
  ratings: Rating[],
  todayKey: string
): MeasureStats[] {
  return measures.map((measure) => {
    const mine = ratings
      .filter((r) => r.measureId === measure.id && r.dayKey <= todayKey)
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    const count = mine.length;
    const average =
      count === 0 ? 0 : mine.reduce((sum, r) => sum + r.value, 0) / count;

    const last7 = mine.filter((r) => r.dayKey >= shiftDayKey(todayKey, -6));
    const last7Average =
      last7.length === 0
        ? null
        : last7.reduce((sum, r) => sum + r.value, 0) / last7.length;

    let streak = 0;
    let cursor = todayKey;
    const byDay = new Map(mine.map((r) => [r.dayKey, r.value]));
    // If today not rated, start from yesterday for streak of completed days
    if (!byDay.has(todayKey)) {
      cursor = shiftDayKey(todayKey, -1);
    }
    while (byDay.has(cursor)) {
      streak += 1;
      cursor = shiftDayKey(cursor, -1);
    }

    return {
      measureId: measure.id,
      measureName: measure.name,
      count,
      average,
      last7Average,
      streak,
    };
  });
}
