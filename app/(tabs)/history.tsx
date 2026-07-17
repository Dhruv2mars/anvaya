import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { formatShortDate } from "@/src/domain/day-key";
import { formatHistoryMarks } from "@/src/domain/display";
import { colors, radius, space, type } from "@/src/theme/tokens";
import { computeMetricStats } from "@/src/stats/patterns";
import * as repo from "@/src/db/repository";
import type { Rating } from "@/src/domain/types";

export default function HistoryScreen() {
  const { history, metrics, todayKey, selectDay } = useApp();
  const router = useRouter();
  const [allRatings, setAllRatings] = useState<Rating[]>([]);

  useEffect(() => {
    void repo.getRecentRatings(60).then(setAllRatings);
  }, [history]);

  const stats = useMemo(
    () => computeMetricStats(metrics, allRatings, todayKey),
    [metrics, allRatings, todayKey]
  );

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>History</Text>
        <Text style={styles.lead}>Past days and quiet patterns. Tap a day to edit.</Text>
      </FadeIn>

      {stats.length > 0 ? (
        <FadeIn delay={40}>
          <View style={styles.patterns}>
            <Text style={styles.section}>Patterns</Text>
            {stats.map((s) => (
              <View key={s.metricId} style={styles.statRow}>
                <Text style={styles.statName}>{s.metricName}</Text>
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
                    {formatHistoryMarks(d.tithi, d.paksha, d.vaar)}
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
