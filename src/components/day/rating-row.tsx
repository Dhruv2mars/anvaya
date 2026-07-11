import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
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
          <Pressable
            key={n}
            accessibilityLabel={`Rate ${n}`}
            accessibilityState={{ selected }}
            hitSlop={6}
            onPress={() => {
              void Haptics.selectionAsync();
              if (value === n && onClear) onClear();
              else onChange(n);
            }}
            style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
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
          </Pressable>
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
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
    color: colors.surface,
  },
});
