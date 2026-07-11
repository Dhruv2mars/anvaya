import {
  getPanchangam,
  Observer,
  tithiNames,
  nakshatraNames,
  dayNames,
} from "@ishubhamx/panchangam-js";
import { civilDayKey, parseDayKey, shiftDayKey } from "@/src/domain/day-key";
import type { LocationFix, PanchangSnapshot } from "@/src/domain/types";

const SANSKRIT_VAAR: Record<string, string> = {
  Sunday: "Ravivaar",
  Monday: "Somvaar",
  Tuesday: "Mangalvaar",
  Wednesday: "Budhvaar",
  Thursday: "Guruvaar",
  Friday: "Shukravaar",
  Saturday: "Shanivaar",
};

function tithiDisplayName(index: number): string {
  // Library uses 0–29 (Shukla Prathama … Amavasya) or 1–30 depending on version.
  // Prefer exported names; fall back to ordinal.
  if (Array.isArray(tithiNames) && tithiNames[index]) {
    return tithiNames[index]!;
  }
  const names = [
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
  ];
  // Map 0–29 or 1–30 into paksha-relative names
  const zeroBased = index >= 1 && index <= 30 ? index - 1 : index;
  const inPaksha = zeroBased % 15;
  if (zeroBased === 14) return "Purnima";
  if (zeroBased === 29) return "Amavasya";
  return names[inPaksha] ?? `Tithi ${index}`;
}

function vaarDisplay(varaIndex: number): string {
  const english = dayNames?.[varaIndex] ?? "—";
  return SANSKRIT_VAAR[english] ?? english;
}

function asDate(value: Date | string | number | null | undefined, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value == null) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/**
 * Resolve the Hindu day key for an absolute instant using sunrise-to-sunrise
 * boundaries at the observer location (not the device civil calendar alone).
 *
 * We probe sunrise for nearby UTC calendar days and pick the interval that
 * contains `now`. The returned key is the civil YYYY-MM-DD of that day's sunrise
 * in the observer's longitude-based local solar sense (library sunrise date).
 */
export function resolveHinduDayKey(now: Date, location: LocationFix): string {
  const observer = new Observer(location.latitude, location.longitude, location.altitude);
  const utcNoon = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  // Start from UTC date of `now`, then scan ±2 days for the containing sunrise window.
  const base = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)
  );

  type Cand = { key: string; sunrise: Date };
  const candidates: Cand[] = [];
  for (let delta = -2; delta <= 2; delta++) {
    const probe = new Date(base.getTime() + delta * 86_400_000);
    const y = probe.getUTCFullYear();
    const m = probe.getUTCMonth() + 1;
    const d = probe.getUTCDate();
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const p = getPanchangam(utcNoon(y, m, d), observer);
    const sunrise = asDate(p.sunrise, utcNoon(y, m, d));
    candidates.push({ key, sunrise });
  }

  candidates.sort((a, b) => a.sunrise.getTime() - b.sunrise.getTime());

  for (let i = 0; i < candidates.length; i++) {
    const start = candidates[i]!;
    const end = candidates[i + 1];
    const afterStart = now.getTime() >= start.sunrise.getTime();
    const beforeEnd = !end || now.getTime() < end.sunrise.getTime();
    if (afterStart && beforeEnd) {
      // Key by the calendar date of sunrise in the observer local zone approx:
      // use the civil day key the library was probed with when sunrise falls on that day.
      return civilDayKey(start.sunrise);
    }
  }

  // Fallback: previous device-local logic
  const civil = civilDayKey(now);
  const todayP = getPanchangam(parseDayKey(civil), observer);
  const sunrise = asDate(todayP.sunrise, parseDayKey(civil));
  if (now.getTime() < sunrise.getTime()) return shiftDayKey(civil, -1);
  return civil;
}

export function computePanchang(dayKey: string, location: LocationFix): PanchangSnapshot {
  const observer = new Observer(location.latitude, location.longitude, location.altitude);
  const date = parseDayKey(dayKey);
  const p = getPanchangam(date, observer);

  const tithiIndex: number = typeof p.tithi === "number" ? p.tithi : 0;
  const masaName =
    typeof p.masa === "object" && p.masa && "name" in p.masa
      ? String((p.masa as { name: string }).name)
      : String(p.masa ?? "");

  const nakshatraIndex: number = typeof p.nakshatra === "number" ? p.nakshatra : 0;
  const nakshatra =
    (Array.isArray(nakshatraNames) && nakshatraNames[nakshatraIndex]) ||
    `Nakshatra ${nakshatraIndex}`;

  const paksha: "Shukla" | "Krishna" =
    p.paksha === "Krishna" || p.paksha === "Shukla" ? p.paksha : tithiIndex >= 15 ? "Krishna" : "Shukla";

  const sunrise = asDate(p.sunrise, date);
  const sunset = asDate(p.sunset, date);

  return {
    dayKey,
    tithi: tithiDisplayName(tithiIndex),
    tithiIndex,
    vaar: vaarDisplay(typeof p.vara === "number" ? p.vara : 0),
    paksha,
    nakshatra,
    masa: masaName,
    sunrise,
    sunset,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function formatPaksha(paksha: "Shukla" | "Krishna"): string {
  return paksha === "Shukla" ? "Shukla Paksha" : "Krishna Paksha";
}
