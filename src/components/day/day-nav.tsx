import { StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  dayKey: string;
  todayKey: string;
  title: string;
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

/** Editorial day header: eyebrow date, Fraunces display title, arrow navigation. */
export function DayNav({
  dayKey,
  todayKey,
  title,
  dateLabel,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const isToday = dayKey === todayKey;

  return (
    <View style={styles.wrap}>
      <View style={styles.navRow}>
        <PressableScale
          onPress={() => {
            void Haptics.selectionAsync();
            onPrev();
          }}
          accessibilityLabel="Previous day"
          pressScale={0.9}
          style={styles.chev}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </PressableScale>

        <View style={styles.center}>
          <Text style={styles.date}>{dateLabel.toUpperCase()}</Text>
          <Text
            key={title}
            style={styles.title}
            accessibilityRole="header"
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.6}
          >
            {title}
          </Text>
        </View>

        <PressableScale
          onPress={() => {
            void Haptics.selectionAsync();
            onNext();
          }}
          disabled={isToday}
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: isToday }}
          pressScale={0.9}
          style={[styles.chev, isToday && styles.chevDisabled]}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={isToday ? colors.inkTertiary : colors.ink}
          />
        </PressableScale>
      </View>

      {!isToday ? (
        <PressableScale
          onPress={onToday}
          accessibilityLabel="Jump to today"
          style={styles.todayChip}
        >
          <Ionicons name="return-down-back" size={14} color={colors.accent} />
          <Text style={styles.todayText}>Back to today</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  chev: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(20, 27, 36, 0.08)",
  },
  chevDisabled: {
    opacity: 0.45,
  },
  center: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  date: {
    ...type.eyebrow,
    color: colors.inkTertiary,
  },
  title: {
    ...type.displayXL,
    color: colors.ink,
    textAlign: "center",
  },
  todayChip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  todayText: {
    ...type.caption,
    color: colors.accent,
    fontFamily: "Manrope_600SemiBold",
  },
});
