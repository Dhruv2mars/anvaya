/**
 * ObservedDay — secular day marks for one Hindu day.
 * Hides engine vocabulary (tithi/vaar/paksha) behind one seam for UI + history.
 */
import { formatTimeAtLongitude } from "@/src/domain/day-key";
import type { DayRecord, PanchangSnapshot } from "@/src/domain/types";

const VAAR_TO_ENGLISH: Record<string, string> = {
  Ravivaar: "Sunday",
  Ravivara: "Sunday",
  Somvaar: "Monday",
  Somvara: "Monday",
  Mangalvaar: "Tuesday",
  Mangalvara: "Tuesday",
  Budhvaar: "Wednesday",
  Budhvara: "Wednesday",
  Guruvaar: "Thursday",
  Guruvara: "Thursday",
  Shukravaar: "Friday",
  Shukravara: "Friday",
  Shanivaar: "Saturday",
  Shanivara: "Saturday",
  Sunday: "Sunday",
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
};

/** Traditional lunar-day names → day-in-cycle (1–15). */
const TITHI_TO_LUNAR_DAY: Record<string, number> = {
  Pratipada: 1,
  Prathama: 1,
  Dwitiya: 2,
  Tritiya: 3,
  Chaturthi: 4,
  Panchami: 5,
  Shashthi: 6,
  Saptami: 7,
  Ashtami: 8,
  Navami: 9,
  Dashami: 10,
  Ekadashi: 11,
  Dwadashi: 12,
  Trayodashi: 13,
  Chaturdashi: 14,
  Purnima: 15,
  Amavasya: 15,
};

export type CyclePhase = "Waxing" | "Waning";

/**
 * Secular marks for a Hindu day at an observer location.
 * Callers never need tithi/vaar/paksha strings.
 */
export type ObservedDay = {
  dayKey: string;
  /** e.g. "Lunar day 11 · Waxing" */
  primary: string | null;
  /** e.g. "Monday" */
  secondary: string;
  sunrise: Date | null;
  longitude: number | null;
};

/** Stored mark fields shared by DayRecord (and optional live tithi index). */
export type StoredDayMarks = {
  dayKey: string;
  tithi: string | null | undefined;
  vaar: string | null | undefined;
  paksha: string | null | undefined;
  sunriseIso?: string | null | undefined;
  longitude?: number | null | undefined;
  tithiIndex?: number | null | undefined;
};

function cyclePhase(
  paksha: string | null | undefined
): CyclePhase | null {
  if (paksha === "Shukla" || paksha === "Shukla Paksha") return "Waxing";
  if (paksha === "Krishna" || paksha === "Krishna Paksha") return "Waning";
  return null;
}

function weekday(vaar: string | null | undefined): string | null {
  if (!vaar) return null;
  return VAAR_TO_ENGLISH[vaar] ?? vaar;
}

function lunarDayFromIndex(tithiIndex: number): number {
  const zeroBased =
    tithiIndex >= 1 && tithiIndex <= 30 ? tithiIndex - 1 : tithiIndex;
  return (zeroBased % 15) + 1;
}

function lunarDayNumber(
  tithi: string | null | undefined,
  tithiIndex?: number | null
): number | null {
  const fromName = tithi ? (TITHI_TO_LUNAR_DAY[tithi] ?? null) : null;
  if (fromName != null) return fromName;
  if (tithiIndex != null && Number.isFinite(tithiIndex)) {
    return lunarDayFromIndex(tithiIndex);
  }
  return null;
}

function primaryLine(
  tithi: string | null | undefined,
  paksha: string | null | undefined,
  tithiIndex?: number | null
): string | null {
  const day = lunarDayNumber(tithi, tithiIndex);
  if (day == null) return null;
  const phase = cyclePhase(paksha);
  const label = `Lunar day ${day}`;
  return phase ? `${label} · ${phase}` : label;
}

function buildObserved(marks: StoredDayMarks): ObservedDay {
  let sunrise: Date | null = null;
  if (marks.sunriseIso) {
    const parsed = new Date(marks.sunriseIso);
    sunrise = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return {
    dayKey: marks.dayKey,
    primary: primaryLine(marks.tithi, marks.paksha, marks.tithiIndex),
    secondary: weekday(marks.vaar) ?? "",
    sunrise,
    longitude: marks.longitude ?? null,
  };
}

/** Live engine snapshot → ObservedDay. */
export function observePanchang(snapshot: PanchangSnapshot): ObservedDay {
  return {
    dayKey: snapshot.dayKey,
    primary: primaryLine(snapshot.tithi, snapshot.paksha, snapshot.tithiIndex),
    secondary: weekday(snapshot.vaar) ?? "",
    sunrise: snapshot.sunrise,
    longitude: snapshot.longitude,
  };
}

/** Persisted day row (or any stored marks) → ObservedDay. */
export function observeStored(marks: StoredDayMarks | DayRecord): ObservedDay {
  return buildObserved(marks);
}

/** Compact history row: "Lunar day 11 · Waning · Monday". */
export function historyMarksLine(day: ObservedDay): string {
  return [day.primary, day.secondary || null].filter(Boolean).join(" · ");
}

/** Sunrise caption for the Today marks block. */
export function sunriseCaption(day: ObservedDay): string | null {
  if (!day.sunrise || day.longitude == null) return null;
  return formatTimeAtLongitude(day.sunrise, day.longitude);
}
