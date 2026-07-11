import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DayNav } from "@/src/components/day/day-nav";
import { MetricRatings } from "@/src/components/day/metric-ratings";
import { NoteField } from "@/src/components/day/note-field";
import { PanchangStrip } from "@/src/components/day/panchang-strip";
import { formatDayHeading, shiftDayKey } from "@/src/domain/day-key";
import { useApp } from "@/src/hooks/app-store";
import { colors, space, type } from "@/src/theme/tokens";

export default function TodayScreen() {
  const {
    todayKey,
    selectedDayKey,
    panchang,
    day,
    metrics,
    allMetrics,
    ratings,
    location,
    selectDay,
    goToday,
    setRating,
    clearRating,
    setNote,
  } = useApp();

  const title = formatDayHeading(selectedDayKey, todayKey);
  const locationLabel =
    location.source === "gps"
      ? "Your location"
      : location.source === "cached"
        ? "Last known location"
        : "Default (Delhi) — enable location for accuracy";

  // Active metrics plus any archived metrics that already have a rating on this day,
  // so history edit never hides preserved scores.
  const visibleMetrics = useMemo(() => {
    const ratedIds = new Set(ratings.map((r) => r.metricId));
    const archivedWithRating = allMetrics.filter(
      (m) => m.archivedAt != null && ratedIds.has(m.id)
    );
    const byId = new Map<string, (typeof metrics)[number]>();
    for (const m of [...metrics, ...archivedWithRating]) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [metrics, allMetrics, ratings]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>Anvaya</Text>

      <DayNav
        dayKey={selectedDayKey}
        todayKey={todayKey}
        title={title}
        onPrev={() => void selectDay(shiftDayKey(selectedDayKey, -1))}
        onNext={() => {
          if (selectedDayKey < todayKey) {
            void selectDay(shiftDayKey(selectedDayKey, 1));
          }
        }}
        onToday={() => void goToday()}
      />

      {panchang ? (
        <PanchangStrip panchang={panchang} locationLabel={locationLabel} />
      ) : (
        <Text style={styles.loading}>Computing Panchang…</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ratings</Text>
        <MetricRatings
          metrics={visibleMetrics}
          ratings={ratings}
          onRate={(id, v) => void setRating(id, v)}
          onClear={(id) => void clearRating(id)}
        />
      </View>

      <View style={styles.section}>
        <NoteField value={day?.note ?? ""} onCommit={(n) => void setNote(n)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  brand: {
    ...type.label,
    color: colors.accent,
    marginTop: space.sm,
  },
  loading: {
    ...type.body,
    color: colors.inkTertiary,
  },
  section: {
    gap: space.md,
    paddingTop: space.sm,
  },
  sectionTitle: {
    ...type.label,
    color: colors.inkSecondary,
  },
});
