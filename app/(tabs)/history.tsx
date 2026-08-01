import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { formatShortDate } from "@/src/domain/day-key";
import { historyMarksLine, observeStored } from "@/src/domain/observed-day";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

function formatDayNumber(dayKey: string): string {
  const short = formatShortDate(dayKey); // "31 Jul"
  return short.split(" ")[0] ?? short;
}

function formatDayMonth(dayKey: string): string {
  const short = formatShortDate(dayKey);
  return (short.split(" ")[1] ?? "").toUpperCase();
}

export default function HistoryScreen() {
  const { history, patterns, selectDay } = useApp();
  const router = useRouter();

  return (
    <Screen>
      <FadeIn>
        <View style={styles.head}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.lead}>Past days and quiet patterns. Tap a day to edit.</Text>
        </View>
      </FadeIn>

      {patterns.length > 0 ? (
        <FadeIn delay={60}>
          <View style={styles.patternsCard}>
            <Text style={styles.eyebrow}>Quiet patterns</Text>
            {patterns.map((s, i) => (
              <View
                key={s.measureId}
                style={[
                  styles.patternRow,
                  i < patterns.length - 1 && styles.patternRowDivider,
                ]}
              >
                <Text style={styles.patternName}>{s.measureName}</Text>
                <View style={styles.patternMeta}>
                  <Text style={styles.patternAvg}>
                    {s.average ? s.average.toFixed(1) : "—"}
                    <Text style={styles.patternAvgUnit}> avg</Text>
                  </Text>
                  <View style={styles.patternChips}>
                    {s.last7Average != null ? (
                      <Text style={styles.chip}>7d {s.last7Average.toFixed(1)}</Text>
                    ) : null}
                    {s.streak > 0 ? (
                      <Text style={[styles.chip, styles.streakChip]}>streak {s.streak}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={120}>
        <Text style={styles.eyebrow}>Days</Text>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your first day starts here</Text>
            <Text style={styles.empty}>
              Rate one measure today. Your days and patterns will gather here.
            </Text>
            <Button
              label="Rate today"
              onPress={() => router.navigate("/")}
              style={styles.emptyAction}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((d, index) => (
              <FadeIn key={d.dayKey} delay={140 + Math.min(index, 6) * 40} offset={10}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${formatShortDate(d.dayKey)}`}
                  style={[
                    styles.row,
                    index < history.length - 1 && styles.rowDivider,
                  ]}
                  pressScale={0.985}
                  onPress={async () => {
                    await selectDay(d.dayKey);
                    router.navigate("/");
                  }}
                >
                  <View style={styles.dateBlock}>
                    <Text style={styles.dayNumber}>{formatDayNumber(d.dayKey)}</Text>
                    <Text style={styles.dayMonth}>{formatDayMonth(d.dayKey)}</Text>
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.marks} numberOfLines={1}>
                      {historyMarksLine(observeStored(d))}
                    </Text>
                    {d.note ? (
                      <Text style={styles.note} numberOfLines={1}>
                        “{d.note}”
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.inkTertiary} />
                </PressableScale>
              </FadeIn>
            ))}
          </View>
        )}
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: space.xs,
  },
  title: { ...type.pageTitle, color: colors.ink },
  lead: { ...type.body, color: colors.inkSecondary },
  eyebrow: { ...type.eyebrow, color: colors.inkSecondary },
  patternsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: 0,
    boxShadow: elevation.card,
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.lg,
    paddingVertical: space.md,
  },
  patternRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  patternName: { ...type.headline, color: colors.ink, flexShrink: 1 },
  patternMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  patternAvg: {
    ...type.marks,
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ["tabular-nums"],
  },
  patternAvgUnit: {
    ...type.caption,
    color: colors.inkTertiary,
  },
  patternChips: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    ...type.caption,
    color: colors.inkSecondary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
    fontVariant: ["tabular-nums"],
  },
  streakChip: {
    color: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingVertical: space.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  dateBlock: {
    width: 52,
    alignItems: "center",
  },
  dayNumber: {
    ...type.marks,
    color: colors.ink,
    fontSize: 26,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  dayMonth: {
    ...type.caption,
    color: colors.inkTertiary,
    letterSpacing: 1.2,
    marginTop: -2,
  },
  rowMain: { flex: 1, gap: 2 },
  marks: { ...type.headline, color: colors.ink, fontSize: 15, lineHeight: 20 },
  note: { ...type.body, color: colors.inkSecondary, fontStyle: "italic" },
  empty: { ...type.body, color: colors.inkSecondary },
  emptyState: { gap: space.sm, paddingVertical: space.lg },
  emptyTitle: { ...type.headline, color: colors.ink },
  emptyAction: {
    alignSelf: "flex-start",
    marginTop: space.sm,
    minHeight: 48,
    paddingHorizontal: space.lg,
  },
});
