import { StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  onClear?: () => void;
};

export function RatingRow({ value, onChange, onClear }: Props) {
  return (
    <View style={styles.row} accessibilityRole="adjustable">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value !== null && n <= value;
        const selected = value === n;
        return (
          <PressableScale
            key={n}
            accessibilityLabel={`Rate ${n}`}
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={() => {
              void Haptics.selectionAsync();
              if (value === n && onClear) onClear();
              else onChange(n);
            }}
            style={styles.hit}
          >
            <View
              style={[
                styles.dot,
                active ? styles.dotActive : styles.dotIdle,
                selected && styles.dotSelected,
              ]}
            >
              <Text
                style={[
                  styles.num,
                  active && styles.numActive,
                  selected && styles.numSelected,
                ]}
              >
                {n}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
  },
  hit: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dotIdle: {
    backgroundColor: colors.surfaceMuted,
  },
  dotActive: {
    backgroundColor: colors.accentSoft,
  },
  dotSelected: {
    backgroundColor: colors.accent,
  },
  num: {
    ...type.bodyMedium,
    color: colors.inkSecondary,
  },
  numActive: {
    color: colors.ink,
    fontFamily: "Manrope_700Bold",
  },
  numSelected: {
    color: colors.accentOn,
  },
});
