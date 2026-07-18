import type { LocationFix } from "@/src/domain/types";

/** Storage keys — owned here so callers never hardcode them. */
export const settingsKeys = {
  onboardingComplete: "onboarding_complete",
  locationCache: "location_cache",
} as const;

export function encodeOnboarded(value: boolean): string {
  return value ? "1" : "0";
}

export function decodeOnboarded(raw: string | null): boolean {
  return raw === "1";
}

export function encodeLocationCache(fix: LocationFix): string {
  return JSON.stringify(fix);
}

export function decodeLocationCache(raw: string | null): LocationFix | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocationFix>;
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        altitude: typeof parsed.altitude === "number" ? parsed.altitude : 0,
        source: "cached",
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** String KV port — SQLite prod, memory tests. */
export type SettingsKv = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

/**
 * Typed settings surface. Callers never see key names or "1"/JSON encoding.
 */
export type SettingsStore = {
  isOnboarded: () => Promise<boolean>;
  setOnboarded: (value: boolean) => Promise<void>;
  getLocationCache: () => Promise<LocationFix | null>;
  setLocationCache: (fix: LocationFix) => Promise<void>;
};

export function createSettingsStore(kv: SettingsKv): SettingsStore {
  return {
    async isOnboarded() {
      return decodeOnboarded(await kv.get(settingsKeys.onboardingComplete));
    },
    async setOnboarded(value) {
      await kv.set(settingsKeys.onboardingComplete, encodeOnboarded(value));
    },
    async getLocationCache() {
      return decodeLocationCache(await kv.get(settingsKeys.locationCache));
    },
    async setLocationCache(fix) {
      await kv.set(settingsKeys.locationCache, encodeLocationCache(fix));
    },
  };
}

export function createMemorySettingsKv(
  initial: Record<string, string> = {}
): SettingsKv & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return data[key] ?? null;
    },
    async set(key, value) {
      data[key] = value;
    },
  };
}
