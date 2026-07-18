import { describe, expect, it } from "vitest";
import {
  historyMarksLine,
  observePanchang,
  observeStored,
  sunriseCaption,
} from "./observed-day";
import type { PanchangSnapshot } from "./types";

const snap = (over: Partial<PanchangSnapshot> = {}): PanchangSnapshot => ({
  dayKey: "2026-07-18",
  tithi: "Ekadashi",
  tithiIndex: 10,
  vaar: "Somvaar",
  paksha: "Krishna",
  nakshatra: "Ashwini",
  masa: "Ashadha",
  sunrise: new Date(Date.UTC(2026, 6, 18, 0, 1, 0)),
  sunset: new Date(Date.UTC(2026, 6, 18, 13, 0, 0)),
  latitude: 28.6139,
  longitude: 77.209,
  ...over,
});

describe("ObservedDay", () => {
  it("maps a live panchang snapshot to secular marks", () => {
    const day = observePanchang(snap());
    expect(day.primary).toBe("Lunar day 11 · Waning");
    expect(day.secondary).toBe("Monday");
    expect(day.dayKey).toBe("2026-07-18");
  });

  it("prefers tithi name over index when both disagree", () => {
    const day = observePanchang(snap({ tithi: "Tritiya", tithiIndex: 2 }));
    expect(day.primary).toBe("Lunar day 3 · Waning");
  });

  it("maps stored DayRecord fields the same way as live marks", () => {
    const day = observeStored({
      dayKey: "2026-07-11",
      tithi: "Ekadashi",
      paksha: "Krishna",
      vaar: "Somvaar",
      sunriseIso: "2026-07-11T00:01:00.000Z",
      longitude: 77.209,
    });
    expect(historyMarksLine(day)).toBe("Lunar day 11 · Waning · Monday");
    expect(sunriseCaption(day)).toBe("5:09 AM");
  });

  it("handles missing marks without inventing copy", () => {
    const day = observeStored({
      dayKey: "2026-07-11",
      tithi: null,
      paksha: null,
      vaar: null,
    });
    expect(day.primary).toBeNull();
    expect(day.secondary).toBe("");
    expect(historyMarksLine(day)).toBe("");
  });

  it("accepts English weekday and Shukla Paksha aliases", () => {
    const day = observeStored({
      dayKey: "2026-07-12",
      tithi: "Pratipada",
      paksha: "Shukla Paksha",
      vaar: "Sunday",
    });
    expect(day.primary).toBe("Lunar day 1 · Waxing");
    expect(day.secondary).toBe("Sunday");
  });
});
