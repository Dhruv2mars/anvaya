import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/src/hooks/app-store";
import { formatShortDate } from "@/src/domain/day-key";
import { formatPaksha } from "@/src/panchang/engine";
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>History</Text>
      <Text style={styles.lead}>Past days and quiet patterns. Tap a day to edit.</Text>

      {stats.length > 0 ? (
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
      ) : null}

      <Text style={styles.section}>Days</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>
          Rated days and notes will gather here. Start on Today.
        </Text>
      ) : (
        <View style={styles.list}>
          {history.map((d) => (
            <Pressable
              key={d.dayKey}
              style={styles.row}
              onPress={async () => {
                await selectDay(d.dayKey);
                router.navigate("/");
              }}
            >
              <View style={styles.rowMain}>
                <Text style={styles.date}>{formatShortDate(d.dayKey)}</Text>
                <Text style={styles.panchang} numberOfLines={1}>
                  {[d.tithi, d.paksha ? formatPaksha(d.paksha as "Shukla" | "Krishna") : null, d.vaar]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                {d.note ? (
                  <Text style={styles.note} numberOfLines={1}>
                    {d.note}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.md,
  },
  title: { ...type.title, color: colors.ink, marginTop: space.sm },
  lead: { ...type.body, color: colors.inkSecondary, marginBottom: space.sm },
  section: { ...type.label, color: colors.inkSecondary, marginTop: space.lg },
  patterns: { gap: space.sm },
  statRow: {
    paddingVertical: space.sm,
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
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowMain: { flex: 1, gap: 2 },
  date: { ...type.headline, color: colors.ink },
  panchang: { ...type.caption, color: colors.inkSecondary },
  note: { ...type.body, color: colors.ink, marginTop: 4 },
  chev: { ...type.title, color: colors.inkTertiary },
  empty: { ...type.body, color: colors.inkSecondary },
});
