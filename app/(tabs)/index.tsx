import { StyleSheet, Text, View } from "react-native";
import { DayNav } from "@/src/components/day/day-nav";
import { MeasureRatings } from "@/src/components/day/measure-ratings";
import { NoteField } from "@/src/components/day/note-field";
import { DayMarks } from "@/src/components/day/day-marks";
import { BrandHeader } from "@/src/components/ui/brand-header";
import { FadeIn } from "@/src/components/ui/fade-in";
import { Screen } from "@/src/components/ui/screen";
import { formatDayHeading, formatFullDate, shiftDayKey } from "@/src/domain/day-key";
import { useApp } from "@/src/hooks/app-store";
import { colors, space, type } from "@/src/theme/tokens";

export default function TodayScreen() {
  const {
    todayKey,
    selectedDayKey,
    observed,
    day,
    measuresForDay: visibleMeasures,
    ratings,
    location,
    selectDay,
    goToday,
    setRating,
    clearRating,
    setNote,
  } = useApp();

  const title = formatDayHeading(selectedDayKey, todayKey);
  const dateLabel = formatFullDate(selectedDayKey);
  const locationLabel =
    location.source === "gps"
      ? "Your location"
      : location.source === "cached"
        ? "Last known location"
        : "Default (Delhi) — enable location for accuracy";

  return (
    <Screen>
      <FadeIn delay={0}>
        <BrandHeader />
      </FadeIn>

      <FadeIn delay={50}>
        <DayNav
          dayKey={selectedDayKey}
          todayKey={todayKey}
          title={title}
          dateLabel={dateLabel}
          onPrev={() => void selectDay(shiftDayKey(selectedDayKey, -1))}
          onNext={() => {
            if (selectedDayKey < todayKey) {
              void selectDay(shiftDayKey(selectedDayKey, 1));
            }
          }}
          onToday={() => void goToday()}
        />
      </FadeIn>

      <FadeIn delay={110}>
        {observed ? (
          <DayMarks observed={observed} locationLabel={locationLabel} />
        ) : (
          <Text style={styles.loading}>Reading the sky…</Text>
        )}
      </FadeIn>

      <FadeIn delay={170}>
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Rate the day</Text>
          <MeasureRatings
            measures={visibleMeasures}
            ratings={ratings}
            onRate={(id, v) => void setRating(id, v)}
            onClear={(id) => void clearRating(id)}
          />
        </View>
      </FadeIn>

      <FadeIn delay={230}>
        <NoteField
          key={selectedDayKey}
          dayKey={selectedDayKey}
          value={day?.note ?? ""}
          onCommit={(n) => void setNote(n)}
        />
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
  },
  sectionEyebrow: {
    ...type.eyebrow,
    color: colors.inkSecondary,
  },
});
