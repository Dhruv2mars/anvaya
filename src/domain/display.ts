/**
 * User-facing copy for lunar/solar day marks — secular framing only.
 * Engine may still compute traditional fields; UI never surfaces them.
 */

const VAAR_TO_ENGLISH: Record<string, string> = {
  Ravivaar: "Sunday",
  Somvaar: "Monday",
  Mangalvaar: "Tuesday",
  Budhvaar: "Wednesday",
  Guruvaar: "Thursday",
  Shukravaar: "Friday",
  Shanivaar: "Saturday",
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

export function formatCyclePhase(paksha: "Shukla" | "Krishna" | string | null | undefined): string | null {
  if (paksha === "Shukla") return "Waxing";
  if (paksha === "Krishna") return "Waning";
  if (paksha === "Shukla Paksha") return "Waxing";
  if (paksha === "Krishna Paksha") return "Waning";
  return null;
}

export function formatWeekday(vaar: string | null | undefined): string | null {
  if (!vaar) return null;
  return VAAR_TO_ENGLISH[vaar] ?? vaar;
}

/** Day within waxing/waning half (1–15) from engine tithi index. */
export function lunarDayFromIndex(tithiIndex: number): number {
  const zeroBased = tithiIndex >= 1 && tithiIndex <= 30 ? tithiIndex - 1 : tithiIndex;
  return (zeroBased % 15) + 1;
}

function lunarDayFromName(tithi: string): number | null {
  return TITHI_TO_LUNAR_DAY[tithi] ?? null;
}

export function formatLunarDayLine(
  tithi: string | null | undefined,
  paksha: string | null | undefined,
  tithiIndex?: number | null
): string | null {
  const fromName = tithi ? lunarDayFromName(tithi) : null;
  const day =
    fromName ??
    (tithiIndex != null && Number.isFinite(tithiIndex) ? lunarDayFromIndex(tithiIndex) : null);
  if (day == null) return null;
  const phase = formatCyclePhase(paksha);
  const label = `Lunar day ${day}`;
  return phase ? `${label} · ${phase}` : label;
}

/** Weekday only — month/asterism stay off the UI (secular). */
export function formatMarksSecondary(
  vaar: string | null | undefined,
  _masa?: string | null | undefined,
  _nakshatra?: string | null | undefined
): string {
  return formatWeekday(vaar) ?? "";
}

export function formatHistoryMarks(
  tithi: string | null | undefined,
  paksha: string | null | undefined,
  vaar: string | null | undefined
): string {
  return [formatLunarDayLine(tithi, paksha), formatWeekday(vaar)].filter(Boolean).join(" · ");
}
