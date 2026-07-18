import { StyleSheet, Text, View } from "react-native";
import type { ObservedDay } from "@/src/domain/observed-day";
import { sunriseCaption } from "@/src/domain/observed-day";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  observed: ObservedDay;
  locationLabel: string;
};

/** Lunar and solar day marks for the selected sunrise-based day. */
export function DayMarks({ observed, locationLabel }: Props) {
  const sunrise = sunriseCaption(observed);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.kicker}>Day marks</Text>
      {observed.primary ? <Text style={styles.primary}>{observed.primary}</Text> : null}
      {observed.secondary ? (
        <Text style={styles.secondary}>{observed.secondary}</Text>
      ) : null}
      <Text style={styles.meta}>
        {sunrise ? `Sunrise ${sunrise} · ` : ""}
        {locationLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    backgroundColor: colors.marksWash,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  kicker: {
    ...type.caption,
    color: colors.inkSecondary,
    marginBottom: space.xs,
  },
  primary: {
    ...type.marks,
    color: colors.ink,
  },
  secondary: {
    ...type.body,
    color: colors.inkSecondary,
  },
  meta: {
    ...type.caption,
    color: colors.inkSecondary,
    marginTop: space.sm,
  },
});
