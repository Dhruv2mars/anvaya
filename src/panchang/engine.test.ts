import { describe, expect, it } from "vitest";
import { computePanchang, resolveHinduDayKey } from "./engine";
import { DEFAULT_LOCATION } from "../domain/types";

describe("panchang engine", () => {
  it("returns Tithi, Vaar, Paksha for Delhi", () => {
    const snap = computePanchang("2024-01-15", DEFAULT_LOCATION);
    expect(snap.tithi.length).toBeGreaterThan(0);
    expect(snap.vaar.length).toBeGreaterThan(0);
    expect(["Shukla", "Krishna"]).toContain(snap.paksha);
    expect(snap.sunrise).toBeInstanceOf(Date);
    expect(snap.masa.length).toBeGreaterThan(0);
  });

  it("uses and preserves the exact supplied coordinates", () => {
    const bengaluru = {
      latitude: 12.9715987,
      longitude: 77.5945627,
      altitude: 920.25,
      source: "gps" as const,
    };

    const snap = computePanchang("2024-01-15", bengaluru);
    const delhiSnap = computePanchang("2024-01-15", DEFAULT_LOCATION);

    expect(snap.latitude).toBe(bengaluru.latitude);
    expect(snap.longitude).toBe(bengaluru.longitude);
    expect(snap.sunrise.toISOString()).not.toBe(delhiSnap.sunrise.toISOString());
  });

  it("uses previous civil day before sunrise", () => {
    // Pre-dawn local: construct a time that is definitely before sunrise
    const beforeSunrise = new Date(2024, 0, 15, 3, 0, 0); // 3am local
    const key = resolveHinduDayKey(beforeSunrise, DEFAULT_LOCATION);
    // At 3am, Hindu day should be previous civil day (Jan 14)
    expect(key).toBe("2024-01-14");
  });

  it("uses same civil day after sunrise", () => {
    const afternoon = new Date(2024, 0, 15, 14, 0, 0);
    const key = resolveHinduDayKey(afternoon, DEFAULT_LOCATION);
    expect(key).toBe("2024-01-15");
  });
});
