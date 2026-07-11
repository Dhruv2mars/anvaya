import * as Location from "expo-location";
import { DEFAULT_LOCATION, type LocationFix } from "@/src/domain/types";
import { getSetting, setSetting } from "@/src/db/repository";

const CACHE_KEY = "location_cache";

export async function loadCachedLocation(): Promise<LocationFix | null> {
  const raw = await getSetting(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocationFix;
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return { ...parsed, source: "cached" };
    }
  } catch {
    return null;
  }
  return null;
}

async function cacheLocation(fix: LocationFix): Promise<void> {
  await setSetting(CACHE_KEY, JSON.stringify(fix));
}

/**
 * Resolve location for Panchang. Prefers GPS, then cache, then Delhi default.
 * Never throws — accuracy degrades gracefully when permission denied.
 * Times out quickly so the UI is never blocked on geolocation prompts.
 */
export async function resolveLocation(options?: {
  requestPermission?: boolean;
}): Promise<{ location: LocationFix; permission: Location.PermissionStatus }> {
  const request = options?.requestPermission ?? false;

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), ms);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  let permission = await withTimeout(Location.getForegroundPermissionsAsync(), 2500);
  if (!permission) {
    const cached = await loadCachedLocation();
    return {
      location: cached ?? DEFAULT_LOCATION,
      permission: Location.PermissionStatus.UNDETERMINED,
    };
  }

  if (request && permission.status !== Location.PermissionStatus.GRANTED) {
    const asked = await withTimeout(Location.requestForegroundPermissionsAsync(), 8000);
    if (asked) permission = asked;
  }

  if (permission.status === Location.PermissionStatus.GRANTED) {
    try {
      const pos = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        5000
      );
      if (pos) {
        const fix: LocationFix = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude ?? 0,
          source: "gps",
        };
        await cacheLocation(fix);
        return { location: fix, permission: permission.status };
      }
    } catch {
      // fall through to cache/default
    }
  }

  const cached = await loadCachedLocation();
  if (cached) {
    return { location: cached, permission: permission.status };
  }

  return { location: DEFAULT_LOCATION, permission: permission.status };
}
