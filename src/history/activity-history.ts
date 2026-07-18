import type { DayRecord, Measure, Rating } from "@/src/domain/types";
import {
  computeMeasureStats,
  type MeasureStats,
} from "@/src/history/quiet-patterns";

/** How far back the days list and pattern ratings look. Owned here, not by screens. */
const DAYS_LIMIT = 120;
const RATINGS_WINDOW_DAYS = 60;

export type ActivityHistorySnapshot = {
  days: DayRecord[];
  patterns: MeasureStats[];
};

/**
 * Persistence deps for activity history.
 * Production wires the repository; tests inject fakes.
 */
export type ActivityHistoryDeps = {
  listDaysWithActivity: (limit: number) => Promise<DayRecord[]>;
  getRecentRatings: (limitDays: number) => Promise<Rating[]>;
};

export type ActivityHistory = {
  getSnapshot: () => ActivityHistorySnapshot;
  subscribe: (listener: () => void) => () => void;
  /**
   * Reload days + recent ratings and recompute patterns.
   * Call after DaySession activity changes, bootstrap, or measure-catalog changes.
   */
  refresh: (input: { measures: Measure[]; todayKey: string }) => Promise<void>;
};

/**
 * Past days with activity plus quiet patterns over recent ratings.
 * Hides window policy and repository reads behind one seam.
 */
export function createActivityHistory(deps: ActivityHistoryDeps): ActivityHistory {
  let snapshot: ActivityHistorySnapshot = { days: [], patterns: [] };
  const listeners = new Set<() => void>();
  let loadGeneration = 0;

  function emit(): void {
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async refresh({ measures, todayKey }) {
      const gen = ++loadGeneration;
      const [days, ratings] = await Promise.all([
        deps.listDaysWithActivity(DAYS_LIMIT),
        deps.getRecentRatings(RATINGS_WINDOW_DAYS),
      ]);
      if (gen !== loadGeneration) return;
      const patterns =
        todayKey.length > 0
          ? computeMeasureStats(measures, ratings, todayKey)
          : [];
      snapshot = { days, patterns };
      emit();
    },
  };
}
