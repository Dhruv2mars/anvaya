/**
 * User-facing copy for lunar/solar day marks — secular framing only.
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

export function formatLunarDayLine(
  tithi: string | null | undefined,
  paksha: string | null | undefined
): string | null {
  if (!tithi) return null;
  const phase = formatCyclePhase(paksha);
  return phase ? `${tithi} · ${phase}` : tithi;
}

export function formatMarksSecondary(
  vaar: string | null | undefined,
  masa: string | null | undefined,
  nakshatra: string | null | undefined
): string {
  return [formatWeekday(vaar), masa, nakshatra].filter(Boolean).join(" · ");
}

export function formatHistoryMarks(
  tithi: string | null | undefined,
  paksha: string | null | undefined,
  vaar: string | null | undefined
): string {
  return [formatLunarDayLine(tithi, paksha), formatWeekday(vaar)].filter(Boolean).join(" · ");
}
