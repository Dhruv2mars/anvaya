import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/src/theme/tokens";

type Props = {
  /** Optional supporting line under the brand */
  tagline?: string;
  /** When true, brand is hero-scale (onboarding) */
  hero?: boolean;
};

export function BrandHeader({ tagline, hero = false }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={hero ? styles.heroBrand : styles.brand} accessibilityRole="header">
        Anvaya
      </Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
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
