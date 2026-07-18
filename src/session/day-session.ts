import type {
  DayRecord,
  LocationFix,
  PanchangSnapshot,
  Rating,
} from "@/src/domain/types";
import {
  observePanchang,
  type ObservedDay,
} from "@/src/domain/observed-day";

/** Observable state for the currently selected Hindu day. */
export type DaySessionSnapshot = {
  selectedDayKey: string;
  todayKey: string;
  location: LocationFix;
  /** Secular day marks — UI reads this, not engine vocabulary. */
  observed: ObservedDay | null;
  day: DayRecord | null;
  ratings: Rating[];
};

/**
 * Persistence + calendar deps DaySession needs.
 * Production wires the real repository and panchang engine;
 * tests inject fakes — this is the external seam.
 */
export type DaySessionDeps = {
  computePanchang: (dayKey: string, location: LocationFix) => PanchangSnapshot;
  resolveHinduDayKey: (now: Date, location: LocationFix) => string;
  upsertDayPanchang: (snapshot: PanchangSnapshot) => Promise<DayRecord>;
  getRatingsForDay: (dayKey: string) => Promise<Rating[]>;
  upsertRating: (
    dayKey: string,
    measureId: string,
    value: number
  ) => Promise<Rating>;
  clearRating: (dayKey: string, measureId: string) => Promise<void>;
  setDayNote: (dayKey: string, note: string) => Promise<string>;
  now?: () => Date;
};

export type DaySession = {
  getSnapshot: () => DaySessionSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Fired after rate / clear / note so the shell can refresh History. */
  onActivityChanged: (listener: (dayKey: string) => void) => () => void;
  selectDay: (dayKey: string) => Promise<void>;
  goToday: () => Promise<void>;
  setRating: (measureId: string, value: number) => Promise<void>;
  clearRating: (measureId: string) => Promise<void>;
  setNote: (note: string) => Promise<void>;
  /**
   * Shell clock: Hindu "today" advanced (e.g. AppState across sunrise).
   * Reloads when the selected day was the previous today.
   */
  notifyTodayKey: (todayKey: string) => Promise<void>;
  /**
   * Shell location update. Updates todayKey from deps.resolveHinduDayKey
   * and reloads when the user was viewing today.
   */
  notifyLocation: (location: LocationFix) => Promise<void>;
  /** Drop in-memory ratings for a deleted measure (catalog stays elsewhere). */
  discardMeasureRatings: (measureId: string) => void;
};

export function createDaySession(
  initial: { location: LocationFix; todayKey: string },
  deps: DaySessionDeps
): DaySession {
  const now = deps.now ?? (() => new Date());
  let loadGeneration = 0;
  /** Engine snapshot kept for note synthesis / persist — not on the public snapshot. */
  let lastPanchang: PanchangSnapshot | null = null;
  let snapshot: DaySessionSnapshot = {
    // Seed with today so UI headings stay valid before the first load resolves.
    selectedDayKey: initial.todayKey,
    todayKey: initial.todayKey,
    location: initial.location,
    observed: null,
    day: null,
    ratings: [],
  };

  const listeners = new Set<() => void>();
  const activityListeners = new Set<(dayKey: string) => void>();

  function emit(): void {
    for (const listener of listeners) listener();
  }

  function emitActivity(dayKey: string): void {
    for (const listener of activityListeners) listener(dayKey);
  }

  function patch(partial: Partial<DaySessionSnapshot>): void {
    snapshot = { ...snapshot, ...partial };
    emit();
  }

  async function loadDay(dayKey: string, location: LocationFix): Promise<void> {
    const gen = ++loadGeneration;
    const panchang = deps.computePanchang(dayKey, location);
    const day = await deps.upsertDayPanchang(panchang);
    const ratings = await deps.getRatingsForDay(dayKey);
    if (gen !== loadGeneration) return;
    lastPanchang = panchang;
    patch({
      selectedDayKey: dayKey,
      location,
      observed: observePanchang(panchang),
      day,
      ratings,
    });
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    onActivityChanged(listener) {
      activityListeners.add(listener);
      return () => {
        activityListeners.delete(listener);
      };
    },

    async selectDay(dayKey) {
      await loadDay(dayKey, snapshot.location);
    },

    async goToday() {
      const key = deps.resolveHinduDayKey(now(), snapshot.location);
      patch({ todayKey: key });
      await loadDay(key, snapshot.location);
    },

    async setRating(measureId, value) {
      const dayKey = snapshot.selectedDayKey;
      if (!dayKey) return;
      const updated = await deps.upsertRating(dayKey, measureId, value);
      // Drop in-memory patch if the user navigated away mid-write.
      if (snapshot.selectedDayKey === dayKey) {
        patch({
          ratings: [
            ...snapshot.ratings.filter((r) => r.measureId !== measureId),
            updated,
          ],
        });
      }
      emitActivity(dayKey);
    },

    async clearRating(measureId) {
      const dayKey = snapshot.selectedDayKey;
      if (!dayKey) return;
      await deps.clearRating(dayKey, measureId);
      if (snapshot.selectedDayKey === dayKey) {
        patch({
          ratings: snapshot.ratings.filter((r) => r.measureId !== measureId),
        });
      }
      emitActivity(dayKey);
    },

    async setNote(note) {
      const dayKey = snapshot.selectedDayKey;
      if (!dayKey) return;
      // Capture day context before await — snapshot may change on navigation.
      const location = snapshot.location;
      const day = snapshot.day;
      const panchang = lastPanchang;
      const trimmed = await deps.setDayNote(dayKey, note);
      const nextDay: DayRecord = day
        ? { ...day, note: trimmed, noteUpdatedAt: Date.now() }
        : {
            dayKey,
            note: trimmed,
            noteUpdatedAt: Date.now(),
            tithi: panchang?.tithi ?? null,
            vaar: panchang?.vaar ?? null,
            paksha: panchang?.paksha ?? null,
            nakshatra: panchang?.nakshatra ?? null,
            masa: panchang?.masa ?? null,
            sunriseIso: panchang?.sunrise.toISOString() ?? null,
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: Date.now(),
          };
      if (snapshot.selectedDayKey === dayKey) {
        patch({ day: nextDay });
      }
      emitActivity(dayKey);
    },

    async notifyTodayKey(todayKey) {
      if (todayKey === snapshot.todayKey) return;
      const wasViewingToday = snapshot.selectedDayKey === snapshot.todayKey;
      patch({ todayKey });
      if (wasViewingToday) {
        await loadDay(todayKey, snapshot.location);
      }
    },

    async notifyLocation(location) {
      const wasViewingToday =
        !snapshot.selectedDayKey ||
        snapshot.selectedDayKey === snapshot.todayKey;
      const todayKey = deps.resolveHinduDayKey(now(), location);
      // Drop in-flight selectDay loads that captured the old location/panchang.
      loadGeneration += 1;
      patch({ location, todayKey });
      if (wasViewingToday) {
        await loadDay(todayKey, location);
      }
    },

    discardMeasureRatings(measureId) {
      const next = snapshot.ratings.filter((r) => r.measureId !== measureId);
      if (next.length === snapshot.ratings.length) return;
      patch({ ratings: next });
    },
  };
}
