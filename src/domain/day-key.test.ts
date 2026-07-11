import { describe, expect, it } from "vitest";
import {
  civilDayKey,
  shiftDayKey,
  formatDayHeading,
  formatTimeAtLongitude,
} from "./day-key";
import { computeMetricStats } from "../stats/patterns";
import type { Metric, Rating } from "./types";

describe("day-key", () => {
  it("shifts days across month boundaries", () => {
    expect(shiftDayKey("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftDayKey("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("formats relative headings", () => {
    const today = "2026-07-11";
    expect(formatDayHeading(today, today)).toBe("Today");
    expect(formatDayHeading(shiftDayKey(today, -1), today)).toBe("Yesterday");
  });

  it("civilDayKey is stable YYYY-MM-DD", () => {
    expect(civilDayKey(new Date(2026, 6, 11, 15, 30))).toBe("2026-07-11");
  });

  it("formats sunrise at observer longitude, not device TZ", () => {
    // 00:01 UTC ≈ 5:31 AM at ~77.2°E (Delhi-ish 5h offset)
    const utc = new Date(Date.UTC(2026, 6, 11, 0, 1, 0));
    expect(formatTimeAtLongitude(utc, 77.2)).toBe("5:01 AM");
  });
});

describe("patterns", () => {
  const metrics: Metric[] = [
    {
      id: "m1",
      name: "Energy",
      sortOrder: 0,
      archivedAt: null,
      createdAt: 1,
    },
  ];

  it("computes averages and streaks", () => {
    const ratings: Rating[] = [
      { id: "1", dayKey: "2026-07-09", metricId: "m1", value: 4, updatedAt: 1 },
      { id: "2", dayKey: "2026-07-10", metricId: "m1", value: 5, updatedAt: 1 },
      { id: "3", dayKey: "2026-07-11", metricId: "m1", value: 3, updatedAt: 1 },
    ];
    const stats = computeMetricStats(metrics, ratings, "2026-07-11");
    expect(stats[0]!.average).toBeCloseTo(4);
    expect(stats[0]!.streak).toBe(3);
    expect(stats[0]!.count).toBe(3);
  });
});
