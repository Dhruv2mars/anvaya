import { StyleSheet, Text, View } from "react-native";
import type { PanchangSnapshot } from "@/src/domain/types";
import { formatTimeAtLongitude } from "@/src/domain/day-key";
import { formatPaksha } from "@/src/panchang/engine";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  panchang: PanchangSnapshot;
  locationLabel: string;
};

export function PanchangStrip({ panchang, locationLabel }: Props) {
  const sunrise = formatTimeAtLongitude(panchang.sunrise, panchang.longitude);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.primary}>
        {panchang.tithi} · {formatPaksha(panchang.paksha)}
      </Text>
      <Text style={styles.secondary}>
        {panchang.vaar} · {panchang.masa} · {panchang.nakshatra}
      </Text>
      <Text style={styles.meta}>
        Sunrise {sunrise} · {locationLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    backgroundColor: colors.panchangWash,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  primary: {
    ...type.panchang,
    color: colors.ink,
  },
  secondary: {
    ...type.body,
    color: colors.inkSecondary,
  },
  meta: {
    ...type.caption,
    color: colors.inkTertiary,
    marginTop: space.xs,
  },
});
