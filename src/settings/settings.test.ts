import { describe, expect, it } from "vitest";
import {
  createMemorySettingsKv,
  createSettingsStore,
  decodeLocationCache,
  decodeOnboarded,
  encodeLocationCache,
  encodeOnboarded,
  settingsKeys,
} from "./settings";
import type { LocationFix } from "@/src/domain/types";

describe("settings codecs", () => {
  it("encodes onboarding as a boolean flag, not a raw string callers invent", () => {
    expect(encodeOnboarded(true)).toBe("1");
    expect(encodeOnboarded(false)).toBe("0");
    expect(decodeOnboarded("1")).toBe(true);
    expect(decodeOnboarded("0")).toBe(false);
    expect(decodeOnboarded(null)).toBe(false);
  });

  it("round-trips a location cache and forces source to cached on read", () => {
    const fix: LocationFix = {
      latitude: 12.97,
      longitude: 77.59,
      altitude: 920,
      source: "gps",
    };
    const raw = encodeLocationCache(fix);
    expect(JSON.parse(raw).latitude).toBe(12.97);
    expect(decodeLocationCache(raw)).toEqual({
      ...fix,
      source: "cached",
    });
    expect(decodeLocationCache("not-json")).toBeNull();
  });

  it("rejects non-finite or out-of-range cached coordinates", () => {
    expect(
      decodeLocationCache(
        JSON.stringify({ latitude: Infinity, longitude: 77.59, altitude: 0 })
      )
    ).toBeNull();
    expect(
      decodeLocationCache(
        JSON.stringify({ latitude: 91, longitude: 77.59, altitude: 0 })
      )
    ).toBeNull();
    expect(
      decodeLocationCache(
        JSON.stringify({ latitude: 12.97, longitude: -181, altitude: 0 })
      )
    ).toBeNull();
    expect(
      decodeLocationCache(
        JSON.stringify({ latitude: 12.97, longitude: 77.59, altitude: NaN })
      )
    ).toBeNull();
  });
});

describe("SettingsStore", () => {
  it("hides key names behind a typed interface", async () => {
    const kv = createMemorySettingsKv();
    const settings = createSettingsStore(kv);

    expect(await settings.isOnboarded()).toBe(false);
    await settings.setOnboarded(true);
    expect(await settings.isOnboarded()).toBe(true);
    expect(kv.data[settingsKeys.onboardingComplete]).toBe("1");

    const fix: LocationFix = {
      latitude: 19.07,
      longitude: 72.87,
      altitude: 14,
      source: "gps",
    };
    await settings.setLocationCache(fix);
    expect(await settings.getLocationCache()).toMatchObject({
      latitude: 19.07,
      longitude: 72.87,
      source: "cached",
    });
    expect(kv.data[settingsKeys.locationCache]).toContain("19.07");
  });
});
