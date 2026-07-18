import type { Measure, Rating } from "@/src/domain/types";

/**
 * Measures shown when rating a Hindu day.
 *
 * Active measures always appear. Archived measures appear only when they
 * already have a rating on that day — so editing history never hides
 * preserved scores.
 */
export function measuresForDay(
  catalog: Measure[],
  dayRatings: readonly Pick<Rating, "measureId">[]
): Measure[] {
  const ratedIds = new Set(dayRatings.map((r) => r.measureId));
  return catalog
    .filter((m) => m.archivedAt == null || ratedIds.has(m.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
}
