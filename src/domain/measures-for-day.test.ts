import { describe, expect, it } from "vitest";
import { measuresForDay } from "./measures-for-day";
import type { Measure, Rating } from "./types";

function measure(
  id: string,
  sortOrder: number,
  archivedAt: number | null = null
): Measure {
  return {
    id,
    name: id,
    sortOrder,
    archivedAt,
    createdAt: sortOrder,
  };
}

describe("measuresForDay", () => {
  const energy = measure("energy", 0);
  const mood = measure("mood", 1);
  const sleep = measure("sleep", 2, 1000);

  it("returns active measures sorted by sortOrder", () => {
    expect(measuresForDay([mood, energy, sleep], [])).toEqual([energy, mood]);
  });

  it("includes archived measures that already have a rating on the day", () => {
    const ratings: Pick<Rating, "measureId">[] = [{ measureId: "sleep" }];
    expect(measuresForDay([energy, mood, sleep], ratings).map((m) => m.id)).toEqual([
      "energy",
      "mood",
      "sleep",
    ]);
  });

  it("omits archived measures with no rating on the day", () => {
    const ratings: Pick<Rating, "measureId">[] = [{ measureId: "energy" }];
    expect(measuresForDay([energy, sleep], ratings).map((m) => m.id)).toEqual([
      "energy",
    ]);
  });

  it("keeps a stable order when sortOrder ties", () => {
    const a = measure("a", 0);
    const b = { ...measure("b", 0), createdAt: 2 };
    expect(measuresForDay([b, a], []).map((m) => m.id)).toEqual(["a", "b"]);
  });
});
