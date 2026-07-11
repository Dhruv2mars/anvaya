import { format, parseISO, addDays, subDays } from "date-fns";

/** Civil calendar day key in local timezone. */
export function civilDayKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDayKey(dayKey: string): Date {
  // Noon local avoids DST edge issues when formatting back
  return parseISO(`${dayKey}T12:00:00`);
}

export function shiftDayKey(dayKey: string, deltaDays: number): string {
  const d = parseDayKey(dayKey);
  return civilDayKey(deltaDays >= 0 ? addDays(d, deltaDays) : subDays(d, Math.abs(deltaDays)));
}

export function formatDayHeading(dayKey: string, todayKey: string): string {
  if (dayKey === todayKey) return "Today";
  if (dayKey === shiftDayKey(todayKey, -1)) return "Yesterday";
  if (dayKey === shiftDayKey(todayKey, 1)) return "Tomorrow";
  return format(parseDayKey(dayKey), "EEE, d MMM yyyy");
}

export function formatShortDate(dayKey: string): string {
  return format(parseDayKey(dayKey), "d MMM");
}
