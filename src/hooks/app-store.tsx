import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { DayRecord, LocationFix, Metric, PanchangSnapshot, Rating } from "@/src/domain/types";
import { DEFAULT_LOCATION } from "@/src/domain/types";
import { resolveHinduDayKey, computePanchang } from "@/src/panchang/engine";
import { resolveLocation } from "@/src/lib/location";
import * as repo from "@/src/db/repository";
import { getDb } from "@/src/db/client";

type AppState = {
  ready: boolean;
  onboardingComplete: boolean;
  location: LocationFix;
  todayKey: string;
  selectedDayKey: string;
  panchang: PanchangSnapshot | null;
  day: DayRecord | null;
  metrics: Metric[];
  allMetrics: Metric[];
  ratings: Rating[];
  history: DayRecord[];
  error: string | null;
};

type AppActions = {
  selectDay: (dayKey: string) => Promise<void>;
  goToday: () => Promise<void>;
  setRating: (metricId: string, value: number) => Promise<void>;
  clearRating: (metricId: string) => Promise<void>;
  setNote: (note: string) => Promise<void>;
  addMetric: (name: string) => Promise<void>;
  renameMetric: (id: string, name: string) => Promise<void>;
  archiveMetric: (id: string) => Promise<void>;
  restoreMetric: (id: string) => Promise<void>;
  reorderMetrics: (ids: string[]) => Promise<void>;
  completeOnboarding: (metricNames: string[]) => Promise<void>;
  refreshLocation: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<(AppState & AppActions) | null>(null);

const listeners = new Set<() => void>();
let version = 0;
function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [location, setLocation] = useState<LocationFix>(DEFAULT_LOCATION);
  const [todayKey, setTodayKey] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [panchang, setPanchang] = useState<PanchangSnapshot | null>(null);
  const [day, setDay] = useState<DayRecord | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Force re-render subscribers when we bump (for external tools)
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );

  const loadDay = useCallback(async (dayKey: string, loc: LocationFix) => {
    const snap = computePanchang(dayKey, loc);
    const dayRow = await repo.upsertDayPanchang(snap);
    const dayRatings = await repo.getRatingsForDay(dayKey);
    setPanchang(snap);
    setDay(dayRow);
    setRatings(dayRatings);
    setSelectedDayKey(dayKey);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const dbTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database open timed out")), 12000)
      );
      await Promise.race([getDb(), dbTimeout]);
      const onboarded = (await repo.getSetting("onboarding_complete")) === "1";
      setOnboardingComplete(onboarded);

      const { location: loc } = await resolveLocation({ requestPermission: false });
      setLocation(loc);

      const now = new Date();
      const hinduToday = resolveHinduDayKey(now, loc);
      setTodayKey(hinduToday);

      const active = await repo.listActiveMetrics();
      const all = await repo.listAllMetrics();
      setMetrics(active);
      setAllMetrics(all);

      await loadDay(hinduToday, loc);
      const hist = await repo.listDaysWithActivity(120);
      setHistory(hist);
      setReady(true);
      bump();
    } catch (e) {
      console.error("Anvaya bootstrap failed", e);
      setError(e instanceof Error ? e.message : "Failed to start Anvaya");
      setReady(true);
    }
  }, [loadDay]);

  useEffect(() => {
    // One-shot local DB + location bootstrap for the session.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount bootstrap
    void bootstrap();
  }, [bootstrap]);

  const selectDay = useCallback(
    async (dayKey: string) => {
      await loadDay(dayKey, location);
      bump();
    },
    [loadDay, location]
  );

  const goToday = useCallback(async () => {
    const key = resolveHinduDayKey(new Date(), location);
    setTodayKey(key);
    await loadDay(key, location);
    bump();
  }, [loadDay, location]);

  const setRating = useCallback(
    async (metricId: string, value: number) => {
      const updated = await repo.upsertRating(selectedDayKey, metricId, value);
      setRatings((prev) => {
        const rest = prev.filter((r) => r.metricId !== metricId);
        return [...rest, updated];
      });
      const hist = await repo.listDaysWithActivity(120);
      setHistory(hist);
      bump();
    },
    [selectedDayKey]
  );

  const clearRatingFn = useCallback(
    async (metricId: string) => {
      await repo.clearRating(selectedDayKey, metricId);
      setRatings((prev) => prev.filter((r) => r.metricId !== metricId));
      bump();
    },
    [selectedDayKey]
  );

  const setNote = useCallback(
    async (note: string) => {
      await repo.setDayNote(selectedDayKey, note);
      setDay((prev) =>
        prev
          ? { ...prev, note, noteUpdatedAt: Date.now() }
          : {
              dayKey: selectedDayKey,
              note,
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
            }
      );
      const hist = await repo.listDaysWithActivity(120);
      setHistory(hist);
      bump();
    },
    [selectedDayKey, panchang, location]
  );

  const refreshMetrics = useCallback(async () => {
    setMetrics(await repo.listActiveMetrics());
    setAllMetrics(await repo.listAllMetrics());
  }, []);

  const addMetric = useCallback(
    async (name: string) => {
      await repo.createMetric(name);
      await refreshMetrics();
      bump();
    },
    [refreshMetrics]
  );

  const renameMetricFn = useCallback(
    async (id: string, name: string) => {
      await repo.renameMetric(id, name);
      await refreshMetrics();
      bump();
    },
    [refreshMetrics]
  );

  const archiveMetricFn = useCallback(
    async (id: string) => {
      await repo.archiveMetric(id);
      await refreshMetrics();
      bump();
    },
    [refreshMetrics]
  );

  const restoreMetricFn = useCallback(
    async (id: string) => {
      await repo.restoreMetric(id);
      await refreshMetrics();
      bump();
    },
    [refreshMetrics]
  );

  const reorderMetricsFn = useCallback(
    async (ids: string[]) => {
      await repo.reorderMetrics(ids);
      await refreshMetrics();
      bump();
    },
    [refreshMetrics]
  );

  const completeOnboarding = useCallback(
    async (metricNames: string[]) => {
      for (const name of metricNames) {
        if (name.trim()) await repo.createMetric(name.trim());
      }
      await repo.setSetting("onboarding_complete", "1");
      setOnboardingComplete(true);
      await refreshMetrics();
      const { location: loc } = await resolveLocation({ requestPermission: true });
      setLocation(loc);
      const key = resolveHinduDayKey(new Date(), loc);
      setTodayKey(key);
      await loadDay(key, loc);
      bump();
    },
    [loadDay, refreshMetrics]
  );

  const refreshLocation = useCallback(async () => {
    const { location: loc } = await resolveLocation({ requestPermission: true });
    setLocation(loc);
    const key = resolveHinduDayKey(new Date(), loc);
    setTodayKey(key);
    await loadDay(selectedDayKey || key, loc);
    bump();
  }, [loadDay, selectedDayKey]);

  const refresh = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({
      ready,
      onboardingComplete,
      location,
      todayKey,
      selectedDayKey,
      panchang,
      day,
      metrics,
      allMetrics,
      ratings,
      history,
      error,
      selectDay,
      goToday,
      setRating,
      clearRating: clearRatingFn,
      setNote,
      addMetric,
      renameMetric: renameMetricFn,
      archiveMetric: archiveMetricFn,
      restoreMetric: restoreMetricFn,
      reorderMetrics: reorderMetricsFn,
      completeOnboarding,
      refreshLocation,
      refresh,
    }),
    [
      ready,
      onboardingComplete,
      location,
      todayKey,
      selectedDayKey,
      panchang,
      day,
      metrics,
      allMetrics,
      ratings,
      history,
      error,
      selectDay,
      goToday,
      setRating,
      clearRatingFn,
      setNote,
      addMetric,
      renameMetricFn,
      archiveMetricFn,
      restoreMetricFn,
      reorderMetricsFn,
      completeOnboarding,
      refreshLocation,
      refresh,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState & AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
