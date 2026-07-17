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

  it("composes lunar day lines", () => {
    expect(formatLunarDayLine("Ekadashi", "Shukla")).toBe("Ekadashi · Waxing");
    expect(formatHistoryMarks("Ekadashi", "Krishna", "Somvaar")).toBe(
      "Ekadashi · Waning · Monday"
    );
  });
});
