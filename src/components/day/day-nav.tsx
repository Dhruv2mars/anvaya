import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  dayKey: string;
  todayKey: string;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function DayNav({ dayKey, todayKey, title, onPrev, onNext, onToday }: Props) {
  const isToday = dayKey === todayKey;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrev}
        accessibilityLabel="Previous day"
        hitSlop={12}
        style={styles.chev}
      >
        <Text style={styles.chevText}>‹</Text>
      </Pressable>

      <Pressable onPress={onToday} style={styles.center} accessibilityRole="header">
        <Text style={styles.title}>{title}</Text>
        {!isToday ? <Text style={styles.jump}>Jump to today</Text> : null}
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={isToday}
        accessibilityLabel="Next day"
        hitSlop={12}
        style={[styles.chev, isToday && styles.disabled]}
      >
        <Text style={[styles.chevText, isToday && styles.disabledText]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  chev: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  chevText: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
    fontFamily: "Manrope_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    ...type.display,
    color: colors.ink,
    textAlign: "center",
  },
  jump: {
    ...type.caption,
    color: colors.accent,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.35,
  },
  disabledText: {
    color: colors.inkTertiary,
  },
});
