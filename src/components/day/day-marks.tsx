import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ObservedDay } from "@/src/domain/observed-day";
import { sunriseCaption } from "@/src/domain/observed-day";
import { MoonGlyph, parsePrimaryForMoon } from "@/src/components/day/moon-glyph";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

type Props = {
  observed: ObservedDay;
  locationLabel: string;
};

/** Sunrise horizon motif — thin rule with a warm dot resting on it. */
function Horizon() {
  return (
    <View style={styles.horizon} accessible={false}>
      <View style={styles.horizonLine} />
      <View style={styles.horizonSun} />
      <View style={styles.horizonLine} />
    </View>
  );
}

/** Lunar and solar day marks for the selected sunrise-based day. */
export function DayMarks({ observed, locationLabel }: Props) {
  const sunrise = sunriseCaption(observed);
  const moon = parsePrimaryForMoon(observed.primary);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <LinearGradient
        colors={[colors.marksWashWarm, colors.marksWash, "#EDF2F6"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.15, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <View style={styles.marksCol}>
          <Text style={styles.eyebrow}>Day marks</Text>
          {observed.primary ? (
            <Text style={styles.primary}>{observed.primary}</Text>
          ) : null}
          {observed.secondary ? (
            <Text style={styles.secondary}>{observed.secondary}</Text>
          ) : null}
        </View>
        {moon ? (
          <View style={styles.moonWrap}>
            <MoonGlyph lunarDay={moon.lunarDay} phase={moon.phase} size={52} />
          </View>
        ) : null}
      </View>

      <Horizon />

      <View style={styles.metaRow}>
        {sunrise ? <Text style={styles.metaAccent}>Sunrise {sunrise}</Text> : null}
        <Text style={styles.meta} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: 20,
    gap: space.md,
    boxShadow: elevation.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.lg,
  },
  marksCol: {
    flex: 1,
    gap: space.xs,
  },
  moonWrap: {
    paddingTop: space.xs,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.accent,
    marginBottom: space.xs,
  },
  primary: {
    ...type.marksLarge,
    color: colors.ink,
  },
  secondary: {
    ...type.body,
    color: colors.inkSecondary,
  },
  horizon: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  horizonLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(20, 27, 36, 0.12)",
  },
  horizonSun: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.accent,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexWrap: "wrap",
  },
  metaAccent: {
    ...type.label,
    color: colors.accent,
    fontVariant: ["tabular-nums"],
  },
  meta: {
    ...type.caption,
    color: colors.inkSecondary,
    flexShrink: 1,
  },
});
