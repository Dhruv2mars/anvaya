import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  /** Optional supporting line under the brand */
  tagline?: string;
  /** When true, brand is hero-scale (onboarding) */
  hero?: boolean;
};

const brandIcon = require("../../../assets/images/icon.png");

export function BrandHeader({ tagline, hero = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Image
          source={brandIcon}
          style={hero ? styles.heroMark : styles.mark}
          resizeMode="contain"
          accessible={false}
        />
        <Text style={hero ? styles.heroBrand : styles.brand} accessibilityRole="header">
          Anvaya
        </Text>
      </View>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  mark: {
    borderRadius: radius.sm,
    borderCurve: "continuous",
    height: 30,
    width: 30,
    boxShadow: "0 2px 6px rgba(20, 27, 36, 0.10)",
  },
  heroMark: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    height: 56,
    width: 56,
  },
  brand: {
    ...type.brand,
    color: colors.ink,
  },
  heroBrand: {
    ...type.display,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -0.35,
    color: colors.ink,
  },
  tagline: {
    ...type.body,
    color: colors.inkSecondary,
  },
});
