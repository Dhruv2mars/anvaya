// Deep imports avoid the package barrel, which re-exports kundli/exporter
// (Node `fs`) and breaks Metro/Expo Go on native.
import { getPanchangam } from "@ishubhamx/panchangam-js/dist/core/panchangam";
import { tithiNames } from "@ishubhamx/panchangam-js/dist/data/tithis";
import { nakshatraNames } from "@ishubhamx/panchangam-js/dist/data/nakshatras";
import { dayNames } from "@ishubhamx/panchangam-js/dist/data/vara";
// Metro resolves astronomy-engine to the CJS build so Observer matches
// panchangam-js `require("astronomy-engine")` instanceof checks.
import { Observer } from "astronomy-engine";
import { civilDayKeyAtLongitude, noonAtLongitude, shiftDayKey } from "@/src/domain/day-key";
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
 * boundaries at the observer location (independent of device timezone).
 */
export function resolveHinduDayKey(now: Date, location: LocationFix): string {
  const observer = new Observer(location.latitude, location.longitude, location.altitude);
  const baseKey = civilDayKeyAtLongitude(now, location.longitude);

  type Cand = { key: string; sunrise: Date };
  const candidates: Cand[] = [];
  for (let delta = -2; delta <= 2; delta++) {
    const key = shiftDayKey(baseKey, delta);
    const p = getPanchangam(noonAtLongitude(key, location.longitude), observer);
    const sunrise = asDate(p.sunrise, noonAtLongitude(key, location.longitude));
    candidates.push({ key, sunrise });
  }

  candidates.sort((a, b) => a.sunrise.getTime() - b.sunrise.getTime());

  for (let i = 0; i < candidates.length; i++) {
    const start = candidates[i]!;
    const end = candidates[i + 1];
    const afterStart = now.getTime() >= start.sunrise.getTime();
    const beforeEnd = !end || now.getTime() < end.sunrise.getTime();
    if (afterStart && beforeEnd) {
      return civilDayKeyAtLongitude(start.sunrise, location.longitude);
    }
  }

  return baseKey;
}

export function computePanchang(dayKey: string, location: LocationFix): PanchangSnapshot {
  const observer = new Observer(location.latitude, location.longitude, location.altitude);
  const date = noonAtLongitude(dayKey, location.longitude);
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
