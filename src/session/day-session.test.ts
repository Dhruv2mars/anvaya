import { describe, expect, it, vi } from "vitest";
import {
  createDaySession,
  type DaySessionDeps,
} from "./day-session";
import type {
  DayRecord,
  LocationFix,
  PanchangSnapshot,
  Rating,
} from "@/src/domain/types";

const delhi: LocationFix = {
  latitude: 28.6139,
  longitude: 77.209,
  altitude: 0,
  source: "default",
};

function makePanchang(dayKey: string, location: LocationFix): PanchangSnapshot {
  return {
    dayKey,
    tithi: "Pratipada",
    tithiIndex: 0,
    vaar: "Ravivara",
    paksha: "Shukla",
    nakshatra: "Ashwini",
    masa: "Ashadha",
    sunrise: new Date(`${dayKey}T01:00:00.000Z`),
    sunset: new Date(`${dayKey}T13:00:00.000Z`),
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function makeDay(dayKey: string, note = ""): DayRecord {
  return {
    dayKey,
    note,
    noteUpdatedAt: note ? 1 : null,
    tithi: "Pratipada",
    vaar: "Ravivara",
    paksha: "Shukla",
    nakshatra: "Ashwini",
    masa: "Ashadha",
    sunriseIso: `${dayKey}T01:00:00.000Z`,
    latitude: delhi.latitude,
    longitude: delhi.longitude,
    updatedAt: 1,
  };
}

function createMemoryDeps(options?: {
  resolveHinduDayKey?: DaySessionDeps["resolveHinduDayKey"];
  now?: () => Date;
}): {
  deps: DaySessionDeps;
  ratings: Map<string, Rating[]>;
  notes: Map<string, string>;
  upsertCalls: string[];
} {
  const ratings = new Map<string, Rating[]>();
  const notes = new Map<string, string>();
  const upsertCalls: string[] = [];

  const deps: DaySessionDeps = {
    computePanchang: makePanchang,
    resolveHinduDayKey:
      options?.resolveHinduDayKey ?? ((_now, _loc) => "2026-07-18"),
    now: options?.now,
    async upsertDayPanchang(snapshot) {
      upsertCalls.push(snapshot.dayKey);
      const note = notes.get(snapshot.dayKey) ?? "";
      return makeDay(snapshot.dayKey, note);
    },
    async getRatingsForDay(dayKey) {
      return [...(ratings.get(dayKey) ?? [])];
    },
    async upsertRating(dayKey, measureId, value) {
      const next: Rating = {
        id: `${dayKey}:${measureId}`,
        dayKey,
        measureId,
        value,
        updatedAt: 1,
      };
      const existing = (ratings.get(dayKey) ?? []).filter(
        (r) => r.measureId !== measureId
      );
      ratings.set(dayKey, [...existing, next]);
      return next;
    },
    async clearRating(dayKey, measureId) {
      ratings.set(
        dayKey,
        (ratings.get(dayKey) ?? []).filter((r) => r.measureId !== measureId)
      );
    },
    async setDayNote(dayKey, note) {
      const trimmed = note.slice(0, 280);
      notes.set(dayKey, trimmed);
      return trimmed;
    },
  };

  return { deps, ratings, notes, upsertCalls };
}

describe("DaySession", () => {
  it("loads a day, rates, and notes — emitting activity for History", async () => {
    const { deps } = createMemoryDeps();
    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    const activity: string[] = [];
    session.onActivityChanged((dayKey) => activity.push(dayKey));

    await session.selectDay("2026-07-18");
    await session.setRating("energy", 4);
    await session.setNote("calm morning");

    const snap = session.getSnapshot();
    expect(snap.selectedDayKey).toBe("2026-07-18");
    expect(snap.observed?.primary).toBe("Lunar day 1 · Waxing");
    expect(snap.observed?.secondary).toBe("Sunday");
    expect(snap.ratings).toEqual([
      {
        id: "2026-07-18:energy",
        dayKey: "2026-07-18",
        measureId: "energy",
        value: 4,
        updatedAt: 1,
      },
    ]);
    expect(snap.day?.note).toBe("calm morning");
    expect(activity).toEqual(["2026-07-18", "2026-07-18"]);
  });

  it("does not apply a late clearRating after navigating away", async () => {
    const { deps, ratings } = createMemoryDeps();
    ratings.set("2026-07-18", [
      {
        id: "2026-07-18:energy",
        dayKey: "2026-07-18",
        measureId: "energy",
        value: 4,
        updatedAt: 1,
      },
    ]);
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const originalClear = deps.clearRating;
    deps.clearRating = async (dayKey, measureId) => {
      await gate;
      return originalClear(dayKey, measureId);
    };

    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    await session.selectDay("2026-07-18");
    expect(session.getSnapshot().ratings).toHaveLength(1);

    const pending = session.clearRating("energy");
    await session.selectDay("2026-07-10");
    release?.();
    await pending;

    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-10");
    expect(session.getSnapshot().ratings).toEqual([]);
    expect(ratings.get("2026-07-18") ?? []).toEqual([]);
  });

  it("does not apply a late rating patch after navigating away", async () => {
    const { deps, ratings } = createMemoryDeps();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const originalUpsert = deps.upsertRating;
    deps.upsertRating = async (dayKey, measureId, value) => {
      await gate;
      return originalUpsert(dayKey, measureId, value);
    };

    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    const activity: string[] = [];
    session.onActivityChanged((dayKey) => activity.push(dayKey));

    await session.selectDay("2026-07-18");
    const pending = session.setRating("energy", 4);
    await session.selectDay("2026-07-10");
    release?.();
    await pending;

    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-10");
    expect(session.getSnapshot().ratings).toEqual([]);
    expect(ratings.get("2026-07-18")?.[0]?.value).toBe(4);
    expect(activity).toEqual(["2026-07-18"]);
  });

  it("does not copy a late note onto a newly selected day", async () => {
    const { deps, notes } = createMemoryDeps();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const originalNote = deps.setDayNote;
    deps.setDayNote = async (dayKey, note) => {
      await gate;
      return originalNote(dayKey, note);
    };

    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    await session.selectDay("2026-07-18");
    const pending = session.setNote("calm morning");
    await session.selectDay("2026-07-10");
    release?.();
    await pending;

    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-10");
    expect(session.getSnapshot().day?.note).toBe("");
    expect(notes.get("2026-07-18")).toBe("calm morning");
  });

  it("discards stale loads when selectDay is called rapidly", async () => {
    const { deps } = createMemoryDeps();
    let releaseSlow: (() => void) | undefined;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const started: string[] = [];

    const originalUpsert = deps.upsertDayPanchang;
    deps.upsertDayPanchang = async (snapshot) => {
      started.push(snapshot.dayKey);
      if (snapshot.dayKey === "2026-07-10") {
        await slowGate;
      }
      return originalUpsert(snapshot);
    };

    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );

    const slow = session.selectDay("2026-07-10");
    const fast = session.selectDay("2026-07-17");
    await fast;
    releaseSlow?.();
    await slow;

    expect(started).toEqual(["2026-07-10", "2026-07-17"]);
    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-17");
  });

  it("reloads when today advances while selected === today", async () => {
    const { deps } = createMemoryDeps({
      resolveHinduDayKey: () => "2026-07-19",
    });
    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    await session.selectDay("2026-07-18");
    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-18");

    await session.notifyTodayKey("2026-07-19");

    const snap = session.getSnapshot();
    expect(snap.todayKey).toBe("2026-07-19");
    expect(snap.selectedDayKey).toBe("2026-07-19");
  });

  it("does not reload a past day when today advances", async () => {
    const { deps } = createMemoryDeps();
    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    await session.selectDay("2026-07-10");

    await session.notifyTodayKey("2026-07-19");

    const snap = session.getSnapshot();
    expect(snap.todayKey).toBe("2026-07-19");
    expect(snap.selectedDayKey).toBe("2026-07-10");
  });

  it("reloads today on location change, leaves past day alone", async () => {
    let hinduToday = "2026-07-18";
    const { deps } = createMemoryDeps({
      resolveHinduDayKey: () => hinduToday,
    });
    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );

    await session.selectDay("2026-07-18");
    hinduToday = "2026-07-18";
    const mumbai: LocationFix = {
      ...delhi,
      latitude: 19.076,
      longitude: 72.8777,
      source: "gps",
    };
    await session.notifyLocation(mumbai);
    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-18");
    expect(session.getSnapshot().location.longitude).toBe(72.8777);

    await session.selectDay("2026-07-10");
    const compute = vi.fn(makePanchang);
    deps.computePanchang = compute;
    await session.notifyLocation(delhi);
    expect(session.getSnapshot().selectedDayKey).toBe("2026-07-10");
    expect(compute).not.toHaveBeenCalled();
  });

  it("discards an in-flight past-day load when location changes", async () => {
    let hinduToday = "2026-07-18";
    const { deps } = createMemoryDeps({
      resolveHinduDayKey: () => hinduToday,
    });
    let releaseSlow: (() => void) | undefined;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const originalUpsert = deps.upsertDayPanchang;
    deps.upsertDayPanchang = async (snapshot) => {
      if (snapshot.dayKey === "2026-07-11") {
        await slowGate;
      }
      return originalUpsert(snapshot);
    };

    const session = createDaySession(
      { location: delhi, todayKey: "2026-07-18" },
      deps
    );
    await session.selectDay("2026-07-10");
    const slow = session.selectDay("2026-07-11");
    const mumbai: LocationFix = {
      ...delhi,
      latitude: 19.076,
      longitude: 72.8777,
      source: "gps",
    };
    hinduToday = "2026-07-18";
    await session.notifyLocation(mumbai);
    releaseSlow?.();
    await slow;

    const snap = session.getSnapshot();
    // Stale 07-11 load discarded; stay on 07-10 with the new location.
    expect(snap.selectedDayKey).toBe("2026-07-10");
    expect(snap.location.longitude).toBe(72.8777);
  });
});
