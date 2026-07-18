import { describe, expect, it } from "vitest";
import {
  civilDayKey,
  shiftDayKey,
  formatDayHeading,
  formatTimeAtLongitude,
} from "./day-key";

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

  it("formatDayHeading tolerates empty keys during session boot", () => {
    expect(formatDayHeading("", "2026-07-11")).toBe("…");
    expect(formatDayHeading("2026-07-11", "")).toBe("Sat, 11 Jul 2026");
  });

  it("civilDayKey is stable YYYY-MM-DD", () => {
    expect(civilDayKey(new Date(2026, 6, 11, 15, 30))).toBe("2026-07-11");
  });

  it("formats sunrise at observer longitude, not device TZ", () => {
    // 00:01 UTC at 77.2°E → +5h 8.8m mean solar ≈ 5:09 AM (not device TZ)
    const utc = new Date(Date.UTC(2026, 6, 11, 0, 1, 0));
    expect(formatTimeAtLongitude(utc, 77.2)).toBe("5:09 AM");
    // Half-hour legal zones still work via fractional offset (82.5°E = IST)
    expect(formatTimeAtLongitude(utc, 82.5)).toBe("5:31 AM");
  });
});
