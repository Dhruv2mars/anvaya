import { StyleSheet, Text, View } from "react-native";
import type { PanchangSnapshot } from "@/src/domain/types";
import { formatPaksha } from "@/src/panchang/engine";
import { colors, space, type } from "@/src/theme/tokens";
import { format } from "date-fns";

type Props = {
  panchang: PanchangSnapshot;
  locationLabel: string;
};

export function PanchangStrip({ panchang, locationLabel }: Props) {
  const sunrise = format(panchang.sunrise, "h:mm a");

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
    paddingVertical: space.sm,
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
    marginTop: 2,
  },
});
