import { format, parseISO, addDays, subDays } from "date-fns";

/** Civil calendar day key in device local timezone (UI formatting helpers). */
export function civilDayKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Approximate civil YYYY-MM-DD at a longitude (15° ≈ 1h), independent of device TZ. */
export function civilDayKeyAtLongitude(date: Date, longitude: number): string {
  const offsetMs = Math.round(longitude / 15) * 3_600_000;
  const shifted = new Date(date.getTime() + offsetMs);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Noon on a day key interpreted at the observer longitude (not device TZ). */
export function noonAtLongitude(dayKey: string, longitude: number): Date {
  const [ys, ms, ds] = dayKey.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const offsetMs = Math.round(longitude / 15) * 3_600_000;
  return new Date(Date.UTC(y, m! - 1, d!, 12, 0, 0) - offsetMs);
}

export function parseDayKey(dayKey: string): Date {
  // Noon local — for display helpers only
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
