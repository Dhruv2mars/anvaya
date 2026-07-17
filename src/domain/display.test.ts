import { describe, expect, it } from "vitest";
import {
  formatCyclePhase,
  formatHistoryMarks,
  formatLunarDayLine,
  formatWeekday,
} from "./display";

describe("display copy", () => {
  it("maps cycle phases to waxing/waning", () => {
    expect(formatCyclePhase("Shukla")).toBe("Waxing");
    expect(formatCyclePhase("Krishna")).toBe("Waning");
  });

  it("normalizes weekday labels", () => {
    expect(formatWeekday("Ravivaar")).toBe("Sunday");
    expect(formatWeekday("Monday")).toBe("Monday");
  });

  it("composes secular lunar day lines", () => {
    expect(formatLunarDayLine("Ekadashi", "Shukla")).toBe("Lunar day 11 · Waxing");
    expect(formatLunarDayLine("Tritiya", "Shukla", 2)).toBe("Lunar day 3 · Waxing");
    expect(formatHistoryMarks("Ekadashi", "Krishna", "Somvaar")).toBe(
      "Lunar day 11 · Waning · Monday"
    );
  });
});
