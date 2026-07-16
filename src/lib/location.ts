import * as Location from "expo-location";
import { DEFAULT_LOCATION, type LocationFix } from "@/src/domain/types";
import { getSetting, setSetting } from "@/src/db/repository";

const CACHE_KEY = "location_cache";
export const INITIAL_LOCATION_PERMISSION: Location.LocationPermissionResponse = {
  status: Location.PermissionStatus.UNDETERMINED,
  granted: false,
  canAskAgain: true,
  expires: "never",
};
let permissionRequest: Promise<Location.LocationPermissionResponse> | null = null;

function requestForegroundPermission(): Promise<Location.LocationPermissionResponse> {
  if (!permissionRequest) {
    permissionRequest = Location.requestForegroundPermissionsAsync().finally(() => {
      permissionRequest = null;
    });
  }
  return permissionRequest;
}

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
 * Never throws — accuracy degrades gracefully when permission is unavailable.
 * Native permission requests remain pending until the user answers and are single-flight.
 */
export async function resolveLocation(options?: {
  requestPermission?: boolean;
}): Promise<{
  location: LocationFix;
  permission: Location.LocationPermissionResponse;
}> {
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
      permission: INITIAL_LOCATION_PERMISSION,
    };
  }

  if (
    request &&
    permission.status !== Location.PermissionStatus.GRANTED &&
    permission.canAskAgain
  ) {
    permission = await requestForegroundPermission();
  }

  if (permission.status === Location.PermissionStatus.GRANTED) {
    try {
      const lastKnown = await withTimeout(
        Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 }),
        1500
      );
      if (lastKnown) {
        const fix: LocationFix = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          altitude: lastKnown.coords.altitude ?? 0,
          source: "gps",
        };
        await cacheLocation(fix);
        return { location: fix, permission };
      }

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
        return { location: fix, permission };
      }
    } catch {
      // fall through to cache/default
    }
  }

  const cached = await loadCachedLocation();
  if (cached) {
    return { location: cached, permission };
  }

  return { location: DEFAULT_LOCATION, permission };
}
