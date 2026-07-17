import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DayNav } from "@/src/components/day/day-nav";
import { MetricRatings } from "@/src/components/day/metric-ratings";
import { NoteField } from "@/src/components/day/note-field";
import { DayMarks } from "@/src/components/day/day-marks";
import { BrandHeader } from "@/src/components/ui/brand-header";
import { FadeIn } from "@/src/components/ui/fade-in";
import { Screen } from "@/src/components/ui/screen";
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
    <Screen>
      <BrandHeader tagline="Your days, your rhythm" />

      <FadeIn delay={40}>
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
      </FadeIn>

      <FadeIn delay={80}>
        {panchang ? (
          <DayMarks panchang={panchang} locationLabel={locationLabel} />
        ) : (
          <Text style={styles.loading}>Computing day marks…</Text>
        )}
      </FadeIn>

      <FadeIn delay={120}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratings</Text>
          <MetricRatings
            metrics={visibleMetrics}
            ratings={ratings}
            onRate={(id, v) => void setRating(id, v)}
            onClear={(id) => void clearRating(id)}
          />
        </View>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={styles.section}>
          <NoteField
            key={selectedDayKey}
            dayKey={selectedDayKey}
            value={day?.note ?? ""}
            onCommit={(n) => void setNote(n)}
          />
        </View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...type.body,
    color: colors.inkTertiary,
    paddingVertical: space.lg,
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
