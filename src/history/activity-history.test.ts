import { describe, expect, it } from "vitest";
import { createActivityHistory } from "./activity-history";
import type { DayRecord, Measure, Rating } from "@/src/domain/types";

function day(dayKey: string, note = "x"): DayRecord {
  return {
    dayKey,
    note,
    noteUpdatedAt: 1,
    tithi: null,
    vaar: null,
    paksha: null,
    nakshatra: null,
    masa: null,
    sunriseIso: null,
    latitude: null,
    longitude: null,
    updatedAt: 1,
  };
}

const energy: Measure = {
  id: "energy",
  name: "Energy",
  sortOrder: 0,
  archivedAt: null,
  createdAt: 1,
};

describe("ActivityHistory", () => {
  it("loads days and computes patterns without exposing repo windows to callers", async () => {
    const listedLimits: number[] = [];
    const ratingWindows: number[] = [];
    const history = createActivityHistory({
      async listDaysWithActivity(limit) {
        listedLimits.push(limit);
        return [day("2026-07-18"), day("2026-07-17")];
      },
      async getRecentRatings(limitDays) {
        ratingWindows.push(limitDays);
        const ratings: Rating[] = [
          {
            id: "1",
            dayKey: "2026-07-18",
            measureId: "energy",
            value: 4,
            updatedAt: 1,
          },
          {
            id: "2",
            dayKey: "2026-07-17",
            measureId: "energy",
            value: 2,
            updatedAt: 1,
          },
        ];
        return ratings;
      },
    });

    await history.refresh({ measures: [energy], todayKey: "2026-07-18" });

    const snap = history.getSnapshot();
    expect(listedLimits).toEqual([120]);
    expect(ratingWindows).toEqual([60]);
    expect(snap.days.map((d) => d.dayKey)).toEqual([
      "2026-07-18",
      "2026-07-17",
    ]);
    expect(snap.patterns).toHaveLength(1);
    expect(snap.patterns[0]?.measureId).toBe("energy");
    expect(snap.patterns[0]?.average).toBe(3);
    expect(snap.patterns[0]?.streak).toBe(2);
  });

  it("discards stale refreshes when called rapidly", async () => {
    let releaseSlow: (() => void) | undefined;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    let call = 0;
    const history = createActivityHistory({
      async listDaysWithActivity() {
        call += 1;
        if (call === 1) await slowGate;
        return [day(call === 1 ? "2026-07-10" : "2026-07-18")];
      },
      async getRecentRatings() {
        return [];
      },
    });

    const slow = history.refresh({ measures: [energy], todayKey: "2026-07-18" });
    const fast = history.refresh({ measures: [energy], todayKey: "2026-07-18" });
    await fast;
    releaseSlow?.();
    await slow;

    expect(history.getSnapshot().days[0]?.dayKey).toBe("2026-07-18");
  });

  it("notifies subscribers when the snapshot changes", async () => {
    const history = createActivityHistory({
      async listDaysWithActivity() {
        return [day("2026-07-18")];
      },
      async getRecentRatings() {
        return [];
      },
    });
    const seen: number[] = [];
    history.subscribe(() => seen.push(history.getSnapshot().days.length));

    await history.refresh({ measures: [], todayKey: "2026-07-18" });
    expect(seen).toEqual([1]);
  });
});
