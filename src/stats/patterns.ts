import type { Metric, Rating } from "@/src/domain/types";

export type MetricStats = {
  metricId: string;
  metricName: string;
  count: number;
  average: number;
  last7Average: number | null;
  streak: number; // consecutive days with any rating ending at latest day
};

export function computeMetricStats(
  metrics: Metric[],
  ratings: Rating[],
  todayKey: string
): MetricStats[] {
  return metrics.map((metric) => {
    const mine = ratings
      .filter((r) => r.metricId === metric.id)
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    const count = mine.length;
    const average =
      count === 0 ? 0 : mine.reduce((sum, r) => sum + r.value, 0) / count;

    const last7 = mine.filter((r) => r.dayKey >= shiftKey(todayKey, -6));
    const last7Average =
      last7.length === 0
        ? null
        : last7.reduce((sum, r) => sum + r.value, 0) / last7.length;

    let streak = 0;
    let cursor = todayKey;
    const byDay = new Map(mine.map((r) => [r.dayKey, r.value]));
    // If today not rated, start from yesterday for streak of completed days
    if (!byDay.has(todayKey)) {
      cursor = shiftKey(todayKey, -1);
    }
    while (byDay.has(cursor)) {
      streak += 1;
      cursor = shiftKey(cursor, -1);
    }

    return {
      metricId: metric.id,
      metricName: metric.name,
      count,
      average,
      last7Average,
      streak,
    };
  });
}

function shiftKey(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function averageByPaksha(
  ratings: Rating[],
  dayPaksha: Map<string, "Shukla" | "Krishna">
): { shukla: number | null; krishna: number | null } {
  const shukla: number[] = [];
  const krishna: number[] = [];
  for (const r of ratings) {
    const p = dayPaksha.get(r.dayKey);
    if (p === "Shukla") shukla.push(r.value);
    if (p === "Krishna") krishna.push(r.value);
  }
  return {
    shukla: shukla.length ? shukla.reduce((a, b) => a + b, 0) / shukla.length : null,
    krishna: krishna.length
      ? krishna.reduce((a, b) => a + b, 0) / krishna.length
      : null,
  };
}
