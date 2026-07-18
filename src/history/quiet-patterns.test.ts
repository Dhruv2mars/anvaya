import { describe, expect, it } from "vitest";
import { computeMeasureStats } from "./quiet-patterns";
import type { Measure, Rating } from "@/src/domain/types";

describe("quiet patterns", () => {
  const measures: Measure[] = [
    {
      id: "m1",
      name: "Energy",
      sortOrder: 0,
      archivedAt: null,
      createdAt: 1,
    },
  ];

  it("computes averages and streaks through the patterns seam", () => {
    const ratings: Rating[] = [
      { id: "1", dayKey: "2026-07-09", measureId: "m1", value: 4, updatedAt: 1 },
      { id: "2", dayKey: "2026-07-10", measureId: "m1", value: 5, updatedAt: 1 },
      { id: "3", dayKey: "2026-07-11", measureId: "m1", value: 3, updatedAt: 1 },
    ];
    const stats = computeMeasureStats(measures, ratings, "2026-07-11");
    expect(stats[0]!.average).toBeCloseTo(4);
    expect(stats[0]!.streak).toBe(3);
    expect(stats[0]!.count).toBe(3);
    expect(stats[0]!.last7Average).toBeCloseTo(4);
  });

  it("starts streak from yesterday when today is unrated", () => {
    const ratings: Rating[] = [
      { id: "1", dayKey: "2026-07-10", measureId: "m1", value: 4, updatedAt: 1 },
      { id: "2", dayKey: "2026-07-09", measureId: "m1", value: 5, updatedAt: 1 },
    ];
    const stats = computeMeasureStats(measures, ratings, "2026-07-11");
    expect(stats[0]!.streak).toBe(2);
  });

  it("excludes future-dated ratings from as-of-today statistics", () => {
    const ratings: Rating[] = [
      { id: "1", dayKey: "2026-07-10", measureId: "m1", value: 4, updatedAt: 1 },
      { id: "2", dayKey: "2026-07-11", measureId: "m1", value: 2, updatedAt: 1 },
      { id: "3", dayKey: "2026-07-12", measureId: "m1", value: 5, updatedAt: 1 },
    ];
    const stats = computeMeasureStats(measures, ratings, "2026-07-11");
    expect(stats[0]!.count).toBe(2);
    expect(stats[0]!.average).toBeCloseTo(3);
    expect(stats[0]!.last7Average).toBeCloseTo(3);
  });
});
