import { StyleSheet, Text, View } from "react-native";
import type { Metric, Rating } from "@/src/domain/types";
import { RatingRow } from "@/src/components/day/rating-row";
import { colors, space, type } from "@/src/theme/tokens";

type Props = {
  metrics: Metric[];
  ratings: Rating[];
  onRate: (metricId: string, value: number) => void;
  onClear: (metricId: string) => void;
};

export function MetricRatings({ metrics, ratings, onRate, onClear }: Props) {
  const byMetric = new Map(ratings.map((r) => [r.metricId, r.value]));

  if (metrics.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No measures yet</Text>
        <Text style={styles.emptyBody}>
          Add a few personal measures in Measures — energy, focus, calm, whatever
          you want to track beside the day.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {metrics.map((metric) => (
        <View key={metric.id} style={styles.item}>
          <Text style={styles.name}>{metric.name}</Text>
          <RatingRow
            value={byMetric.get(metric.id) ?? null}
            onChange={(v) => onRate(metric.id, v)}
            onClear={() => onClear(metric.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.xl,
  },
  item: {
    gap: space.sm,
  },
  name: {
    ...type.headline,
    color: colors.ink,
  },
  empty: {
    gap: space.sm,
    paddingVertical: space.lg,
  },
  emptyTitle: {
    ...type.headline,
    color: colors.ink,
  },
  emptyBody: {
    ...type.body,
    color: colors.inkSecondary,
  },
});
