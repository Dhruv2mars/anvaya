import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState as RNAppState, type AppStateStatus } from "react-native";
import type { LocationPermissionResponse } from "expo-location";
import type { DayRecord, LocationFix, Metric, PanchangSnapshot, Rating } from "@/src/domain/types";
import { DEFAULT_LOCATION } from "@/src/domain/types";
import { resolveHinduDayKey, computePanchang } from "@/src/panchang/engine";
import { INITIAL_LOCATION_PERMISSION, resolveLocation } from "@/src/lib/location";
import * as repo from "@/src/db/repository";
import { getDb } from "@/src/db/client";

type StoreState = {
  ready: boolean;
  onboardingComplete: boolean;
  location: LocationFix;
  locationPermission: LocationPermissionResponse;
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
  deleteArchivedMetric: (id: string) => Promise<void>;
  restoreMetric: (id: string) => Promise<void>;
  reorderMetrics: (ids: string[]) => Promise<void>;
  completeOnboarding: (metricNames: string[]) => Promise<void>;
  refreshLocation: (requestPermission?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<(StoreState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [location, setLocation] = useState<LocationFix>(DEFAULT_LOCATION);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionResponse>(INITIAL_LOCATION_PERMISSION);
  const [todayKey, setTodayKey] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [panchang, setPanchang] = useState<PanchangSnapshot | null>(null);
  const [day, setDay] = useState<DayRecord | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const loadDay = useCallback(async (dayKey: string, loc: LocationFix) => {
    const gen = ++loadGeneration.current;
    const snap = computePanchang(dayKey, loc);
    const dayRow = await repo.upsertDayPanchang(snap);
    const dayRatings = await repo.getRatingsForDay(dayKey);
    if (gen !== loadGeneration.current) return;
    setPanchang(snap);
    setDay(dayRow);
    setRatings(dayRatings);
    setSelectedDayKey(dayKey);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setReady(false);
      setError(null);
      const dbTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database open timed out")), 12000)
      );
      await Promise.race([getDb(), dbTimeout]);
      const onboarded = (await repo.getSetting("onboarding_complete")) === "1";
      setOnboardingComplete(onboarded);

      const { location: loc, permission } = await resolveLocation({
        requestPermission: false,
      });
      setLocation(loc);
      setLocationPermission(permission);

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

  // Recompute Hindu "today" when returning from background across sunrise.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== "active" || !ready) return;
      const key = resolveHinduDayKey(new Date(), location);
      if (key !== todayKey) {
        setTodayKey(key);
        if (selectedDayKey === todayKey) {
          void loadDay(key, location);
        }
      }
    };
    const sub = RNAppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [ready, location, todayKey, selectedDayKey, loadDay]);

  const selectDay = useCallback(
    async (dayKey: string) => {
      await loadDay(dayKey, location);
    },
    [loadDay, location]
  );

  const goToday = useCallback(async () => {
    const key = resolveHinduDayKey(new Date(), location);
    setTodayKey(key);
    await loadDay(key, location);
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
    },
    [selectedDayKey]
  );

  const clearRatingFn = useCallback(
    async (metricId: string) => {
      await repo.clearRating(selectedDayKey, metricId);
      setRatings((prev) => prev.filter((r) => r.metricId !== metricId));
      const hist = await repo.listDaysWithActivity(120);
      setHistory(hist);
    },
    [selectedDayKey]
  );

  const setNote = useCallback(
    async (note: string) => {
      const trimmed = await repo.setDayNote(selectedDayKey, note);
      setDay((prev) =>
        prev
          ? { ...prev, note: trimmed, noteUpdatedAt: Date.now() }
          : {
              dayKey: selectedDayKey,
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
            }
      );
      const hist = await repo.listDaysWithActivity(120);
      setHistory(hist);
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
    },
    [refreshMetrics]
  );

  const renameMetricFn = useCallback(
    async (id: string, name: string) => {
      await repo.renameMetric(id, name);
      await refreshMetrics();
    },
    [refreshMetrics]
  );

  const archiveMetricFn = useCallback(
    async (id: string) => {
      await repo.archiveMetric(id);
      await refreshMetrics();
    },
    [refreshMetrics]
  );

  const deleteArchivedMetricFn = useCallback(
    async (id: string) => {
      await repo.deleteArchivedMetric(id);
      setRatings((prev) => prev.filter((rating) => rating.metricId !== id));
      const [, hist] = await Promise.all([
        refreshMetrics(),
        repo.listDaysWithActivity(120),
      ]);
      setHistory(hist);
    },
    [refreshMetrics]
  );

  const restoreMetricFn = useCallback(
    async (id: string) => {
      await repo.restoreMetric(id);
      await refreshMetrics();
    },
    [refreshMetrics]
  );

  const reorderMetricsFn = useCallback(
    async (ids: string[]) => {
      await repo.reorderMetrics(ids);
      await refreshMetrics();
    },
    [refreshMetrics]
  );

  const completeOnboarding = useCallback(
    async (metricNames: string[]) => {
      for (const name of metricNames) {
        if (name.trim()) await repo.createMetric(name.trim());
      }
      await repo.setSetting("onboarding_complete", "1");
      await refreshMetrics();
      const { location: loc, permission } = await resolveLocation({
        requestPermission: true,
      });
      setLocation(loc);
      setLocationPermission(permission);
      const key = resolveHinduDayKey(new Date(), loc);
      setTodayKey(key);
      await loadDay(key, loc);
      setOnboardingComplete(true);
    },
    [loadDay, refreshMetrics]
  );

  const refreshLocation = useCallback(
    async (requestPermission = true) => {
      const { location: loc, permission } = await resolveLocation({ requestPermission });
      const wasViewingToday = !selectedDayKey || selectedDayKey === todayKey;
      setLocation(loc);
      setLocationPermission(permission);
      const key = resolveHinduDayKey(new Date(), loc);
      setTodayKey(key);
      await loadDay(wasViewingToday ? key : selectedDayKey, loc);
    },
    [loadDay, selectedDayKey, todayKey]
  );

  const refresh = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({
      ready,
      onboardingComplete,
      location,
      locationPermission,
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
      deleteArchivedMetric: deleteArchivedMetricFn,
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
      locationPermission,
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
      deleteArchivedMetricFn,
      restoreMetricFn,
      reorderMetricsFn,
      completeOnboarding,
      refreshLocation,
      refresh,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): StoreState & AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
