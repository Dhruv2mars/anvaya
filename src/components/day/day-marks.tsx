import { StyleSheet, Text, View } from "react-native";
import type { PanchangSnapshot } from "@/src/domain/types";
import { formatTimeAtLongitude } from "@/src/domain/day-key";
import {
  formatLunarDayLine,
  formatMarksSecondary,
} from "@/src/domain/display";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  panchang: PanchangSnapshot;
  locationLabel: string;
};

/** Lunar and solar day marks for the selected sunrise-based day. */
export function DayMarks({ panchang, locationLabel }: Props) {
  const sunrise = formatTimeAtLongitude(panchang.sunrise, panchang.longitude);
  const primary = formatLunarDayLine(panchang.tithi, panchang.paksha, panchang.tithiIndex);
  const secondary = formatMarksSecondary(panchang.vaar);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.kicker}>Day marks</Text>
      {primary ? <Text style={styles.primary}>{primary}</Text> : null}
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
      <Text style={styles.meta}>
        Sunrise {sunrise} · {locationLabel}
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
