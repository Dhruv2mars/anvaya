import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { formatShortDate } from "@/src/domain/day-key";
import { historyMarksLine, observeStored } from "@/src/domain/observed-day";
import { colors, radius, space, type } from "@/src/theme/tokens";

export default function HistoryScreen() {
  const { history, patterns, selectDay } = useApp();
  const router = useRouter();

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>History</Text>
        <Text style={styles.lead}>Past days and quiet patterns. Tap a day to edit.</Text>
      </FadeIn>

      {patterns.length > 0 ? (
        <FadeIn delay={40}>
          <View style={styles.patterns}>
            <Text style={styles.section}>Patterns</Text>
            {patterns.map((s) => (
              <View key={s.measureId} style={styles.statRow}>
                <Text style={styles.statName}>{s.measureName}</Text>
                <Text style={styles.statMeta}>
                  avg {s.average ? s.average.toFixed(1) : "—"}
                  {s.last7Average != null
                    ? ` · 7d ${s.last7Average.toFixed(1)}`
                    : ""}
                  {s.streak > 0 ? ` · streak ${s.streak}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={80}>
        <Text style={styles.section}>Days</Text>
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
            {history.map((d) => (
              <PressableScale
                key={d.dayKey}
                accessibilityRole="button"
                accessibilityLabel={`Open ${formatShortDate(d.dayKey)}`}
                style={styles.row}
                onPress={async () => {
                  await selectDay(d.dayKey);
                  router.navigate("/");
                }}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.date}>{formatShortDate(d.dayKey)}</Text>
                  <Text style={styles.marks} numberOfLines={1}>
                    {historyMarksLine(observeStored(d))}
                  </Text>
                  {d.note ? (
                    <Text style={styles.note} numberOfLines={1}>
                      {d.note}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chev}>›</Text>
              </PressableScale>
            ))}
          </View>
        )}
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.title, color: colors.ink },
  lead: { ...type.body, color: colors.inkSecondary },
  section: { ...type.label, color: colors.inkSecondary, marginTop: space.sm },
  patterns: { gap: space.sm },
  statRow: {
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  statName: { ...type.headline, color: colors.ink },
  statMeta: { ...type.caption, color: colors.inkSecondary, marginTop: 2 },
  list: { gap: space.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowMain: { flex: 1, gap: 2 },
  date: { ...type.headline, color: colors.ink },
  marks: { ...type.caption, color: colors.inkSecondary },
  note: { ...type.body, color: colors.ink, marginTop: 4 },
  chev: { ...type.title, color: colors.inkTertiary },
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
