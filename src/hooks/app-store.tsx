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
import type { DayRecord, LocationFix, Measure, Rating } from "@/src/domain/types";
import { DEFAULT_LOCATION } from "@/src/domain/types";
import { resolveHinduDayKey, computePanchang } from "@/src/panchang/engine";
import { INITIAL_LOCATION_PERMISSION, resolveLocation } from "@/src/lib/location";
import * as daysDb from "@/src/db/days";
import * as measuresDb from "@/src/db/measures";
import * as ratingsDb from "@/src/db/ratings";
import { getDb } from "@/src/db/client";
import {
  createDaySession,
  type DaySession,
  type DaySessionSnapshot,
} from "@/src/session/day-session";
import {
  createActivityHistory,
  type ActivityHistory,
  type ActivityHistorySnapshot,
} from "@/src/history/activity-history";
import { measuresForDay } from "@/src/domain/measures-for-day";
import { appSettings } from "@/src/settings/app-settings";
import type { MeasureStats } from "@/src/history/quiet-patterns";

type StoreState = {
  ready: boolean;
  onboardingComplete: boolean;
  location: LocationFix;
  locationPermission: LocationPermissionResponse;
  todayKey: string;
  selectedDayKey: string;
  observed: DaySessionSnapshot["observed"];
  day: DayRecord | null;
  activeMeasures: Measure[];
  allMeasures: Measure[];
  /** Measures visible for the selected day (active ∪ archived-with-rating). */
  measuresForDay: Measure[];
  ratings: Rating[];
  history: DayRecord[];
  patterns: MeasureStats[];
  error: string | null;
};

type AppActions = {
  selectDay: (dayKey: string) => Promise<void>;
  goToday: () => Promise<void>;
  setRating: (measureId: string, value: number) => Promise<void>;
  clearRating: (measureId: string) => Promise<void>;
  setNote: (note: string) => Promise<void>;
  addMeasure: (name: string) => Promise<void>;
  renameMeasure: (id: string, name: string) => Promise<void>;
  archiveMeasure: (id: string) => Promise<void>;
  deleteArchivedMeasure: (id: string) => Promise<void>;
  restoreMeasure: (id: string) => Promise<void>;
  reorderMeasures: (ids: string[]) => Promise<void>;
  completeOnboarding: (measureNames: string[]) => Promise<void>;
  refreshLocation: (requestPermission?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<(StoreState & AppActions) | null>(null);

const daySessionDeps = {
  computePanchang,
  resolveHinduDayKey,
  upsertDayPanchang: daysDb.upsertDayPanchang,
  getRatingsForDay: ratingsDb.getRatingsForDay,
  upsertRating: ratingsDb.upsertRating,
  clearRating: ratingsDb.clearRating,
  setDayNote: daysDb.setDayNote,
};

const activityHistoryDeps = {
  listDaysWithActivity: daysDb.listDaysWithActivity,
  getRecentRatings: ratingsDb.getRecentRatings,
};

function emptyDaySnapshot(location: LocationFix, todayKey: string): DaySessionSnapshot {
  return {
    selectedDayKey: "",
    todayKey,
    location,
    observed: null,
    day: null,
    ratings: [],
  };
}

const emptyActivity: ActivityHistorySnapshot = { days: [], patterns: [] };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [location, setLocation] = useState<LocationFix>(DEFAULT_LOCATION);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionResponse>(INITIAL_LOCATION_PERMISSION);
  const [todayKey, setTodayKey] = useState("");
  const [daySnap, setDaySnap] = useState<DaySessionSnapshot>(() =>
    emptyDaySnapshot(DEFAULT_LOCATION, "")
  );
  const [activeMeasures, setActiveMeasures] = useState<Measure[]>([]);
  const [allMeasures, setAllMeasures] = useState<Measure[]>([]);
  const [activitySnap, setActivitySnap] =
    useState<ActivityHistorySnapshot>(emptyActivity);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<DaySession | null>(null);
  const sessionUnsubRef = useRef<(() => void) | null>(null);
  const activityRef = useRef<ActivityHistory>(
    createActivityHistory(activityHistoryDeps)
  );
  const measuresRef = useRef<Measure[]>([]);
  const todayKeyRef = useRef("");

  const refreshActivity = useCallback(async () => {
    const activity = activityRef.current;
    await activity.refresh({
      measures: measuresRef.current,
      todayKey: todayKeyRef.current,
    });
    setActivitySnap(activity.getSnapshot());
  }, []);

  const attachSession = useCallback(
    (session: DaySession) => {
      sessionUnsubRef.current?.();
      sessionRef.current = session;
      setDaySnap(session.getSnapshot());
      const unsubState = session.subscribe(() => {
        const snap = session.getSnapshot();
        setDaySnap(snap);
        setTodayKey(snap.todayKey);
        todayKeyRef.current = snap.todayKey;
        setLocation(snap.location);
      });
      const unsubActivity = session.onActivityChanged(() => {
        void refreshActivity();
      });
      sessionUnsubRef.current = () => {
        unsubState();
        unsubActivity();
      };
    },
    [refreshActivity]
  );

  const bootstrap = useCallback(async () => {
    try {
      setReady(false);
      setError(null);
      const dbTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database open timed out")), 12000)
      );
      await Promise.race([getDb(), dbTimeout]);
      const onboarded = await appSettings.isOnboarded();
      setOnboardingComplete(onboarded);

      const { location: loc, permission } = await resolveLocation({
        requestPermission: false,
      });
      setLocation(loc);
      setLocationPermission(permission);

      const hinduToday = resolveHinduDayKey(new Date(), loc);
      setTodayKey(hinduToday);
      todayKeyRef.current = hinduToday;

      const active = await measuresDb.listActiveMeasures();
      const all = await measuresDb.listAllMeasures();
      setActiveMeasures(active);
      setAllMeasures(all);
      measuresRef.current = active;

      const session = createDaySession(
        { location: loc, todayKey: hinduToday },
        daySessionDeps
      );
      attachSession(session);
      await session.selectDay(hinduToday);
      await refreshActivity();
      setReady(true);
    } catch (e) {
      console.error("Anvaya bootstrap failed", e);
      setError(e instanceof Error ? e.message : "Failed to start Anvaya");
      setReady(true);
    }
  }, [attachSession, refreshActivity]);

  useEffect(() => {
    // One-shot local DB + location bootstrap for the session.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount bootstrap
    void bootstrap();
    const activity = activityRef.current;
    const unsubActivitySnap = activity.subscribe(() => {
      setActivitySnap(activity.getSnapshot());
    });
    return () => {
      sessionUnsubRef.current?.();
      sessionUnsubRef.current = null;
      sessionRef.current = null;
      unsubActivitySnap();
    };
  }, [bootstrap]);

  // Shell clock: recompute Hindu "today" when returning from background across sunrise.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== "active" || !ready) return;
      const key = resolveHinduDayKey(new Date(), location);
      if (key !== todayKey) {
        setTodayKey(key);
        todayKeyRef.current = key;
        void sessionRef.current?.notifyTodayKey(key);
        void refreshActivity();
      }
    };
    const sub = RNAppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [ready, location, todayKey, refreshActivity]);

  const selectDay = useCallback(async (dayKey: string) => {
    await sessionRef.current?.selectDay(dayKey);
  }, []);

  const goToday = useCallback(async () => {
    await sessionRef.current?.goToday();
  }, []);

  const setRating = useCallback(async (measureId: string, value: number) => {
    await sessionRef.current?.setRating(measureId, value);
  }, []);

  const clearRatingFn = useCallback(async (measureId: string) => {
    await sessionRef.current?.clearRating(measureId);
  }, []);

  const setNote = useCallback(async (note: string) => {
    await sessionRef.current?.setNote(note);
  }, []);

  const refreshMeasures = useCallback(async () => {
    const active = await measuresDb.listActiveMeasures();
    const all = await measuresDb.listAllMeasures();
    setActiveMeasures(active);
    setAllMeasures(all);
    measuresRef.current = active;
    await refreshActivity();
  }, [refreshActivity]);

  const addMeasure = useCallback(
    async (name: string) => {
      await measuresDb.createMeasure(name);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const renameMeasureFn = useCallback(
    async (id: string, name: string) => {
      await measuresDb.renameMeasure(id, name);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const archiveMeasureFn = useCallback(
    async (id: string) => {
      await measuresDb.archiveMeasure(id);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const deleteArchivedMeasureFn = useCallback(
    async (id: string) => {
      await measuresDb.deleteArchivedMeasure(id);
      sessionRef.current?.discardMeasureRatings(id);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const restoreMeasureFn = useCallback(
    async (id: string) => {
      await measuresDb.restoreMeasure(id);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const reorderMeasuresFn = useCallback(
    async (ids: string[]) => {
      await measuresDb.reorderMeasures(ids);
      await refreshMeasures();
    },
    [refreshMeasures]
  );

  const completeOnboarding = useCallback(
    async (measureNames: string[]) => {
      await measuresDb.completeOnboardingSetup(measureNames);
      const active = await measuresDb.listActiveMeasures();
      const all = await measuresDb.listAllMeasures();
      setActiveMeasures(active);
      setAllMeasures(all);
      measuresRef.current = active;

      const { location: loc, permission } = await resolveLocation({
        requestPermission: true,
        forceCurrent: true,
      });
      setLocation(loc);
      setLocationPermission(permission);
      const key = resolveHinduDayKey(new Date(), loc);
      setTodayKey(key);
      todayKeyRef.current = key;
      // Load the first day before flipping onboarding — otherwise Today mounts
      // with selectedDayKey "" and formatDayHeading throws Invalid time value.
      const session = createDaySession({ location: loc, todayKey: key }, daySessionDeps);
      attachSession(session);
      await session.selectDay(key);
      await refreshActivity();
      setOnboardingComplete(true);
    },
    [attachSession, refreshActivity]
  );

  const refreshLocation = useCallback(
    async (requestPermission = true) => {
      const { location: loc, permission } = await resolveLocation({
        requestPermission,
        forceCurrent: true,
      });
      setLocationPermission(permission);
      await sessionRef.current?.notifyLocation(loc);
    },
    []
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
      todayKey: daySnap.todayKey || todayKey,
      selectedDayKey: daySnap.selectedDayKey,
      observed: daySnap.observed,
      day: daySnap.day,
      activeMeasures,
      allMeasures,
      measuresForDay: measuresForDay(allMeasures, daySnap.ratings),
      ratings: daySnap.ratings,
      history: activitySnap.days,
      patterns: activitySnap.patterns,
      error,
      selectDay,
      goToday,
      setRating,
      clearRating: clearRatingFn,
      setNote,
      addMeasure,
      renameMeasure: renameMeasureFn,
      archiveMeasure: archiveMeasureFn,
      deleteArchivedMeasure: deleteArchivedMeasureFn,
      restoreMeasure: restoreMeasureFn,
      reorderMeasures: reorderMeasuresFn,
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
      daySnap,
      activeMeasures,
      allMeasures,
      activitySnap,
      error,
      selectDay,
      goToday,
      setRating,
      clearRatingFn,
      setNote,
      addMeasure,
      renameMeasureFn,
      archiveMeasureFn,
      deleteArchivedMeasureFn,
      restoreMeasureFn,
      reorderMeasuresFn,
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
