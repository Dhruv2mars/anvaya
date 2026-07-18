import { StyleSheet, Text, View } from "react-native";
import type { Measure, Rating } from "@/src/domain/types";
import { RatingRow } from "@/src/components/day/rating-row";
import { colors, space, type } from "@/src/theme/tokens";

type Props = {
  measures: Measure[];
  ratings: Rating[];
  onRate: (measureId: string, value: number) => void;
  onClear: (measureId: string) => void;
};

export function MeasureRatings({ measures, ratings, onRate, onClear }: Props) {
  const byMeasure = new Map(ratings.map((r) => [r.measureId, r.value]));

  if (measures.length === 0) {
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
      {measures.map((measure) => (
        <View key={measure.id} style={styles.item}>
          <Text style={styles.name}>{measure.name}</Text>
          <RatingRow
            value={byMeasure.get(measure.id) ?? null}
            onChange={(v) => onRate(measure.id, v)}
            onClear={() => onClear(measure.id)}
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
    gap: space.md,
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
