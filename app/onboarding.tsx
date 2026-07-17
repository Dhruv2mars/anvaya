import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";

const SUGGESTIONS = ["Energy", "Focus", "Calm", "Sleep", "Mood"];
const MIN_METRICS = 2;
const MAX_METRICS = 5;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [names, setNames] = useState<string[]>(["Energy", "Focus", "Calm"]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);
  const namesRef = useRef(names);
  const hasMinimumMetrics = names.length >= MIN_METRICS;
  const normalizedNames = useMemo(
    () => new Set(names.map((name) => name.toLowerCase())),
    [names]
  );

  const addName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a metric name.");
      return;
    }

    const current = namesRef.current;
    if (current.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setError("That metric is already added.");
      return;
    }
    if (current.length >= MAX_METRICS) {
      setError(`Choose up to ${MAX_METRICS} metrics.`);
      return;
    }

    const next = [...current, trimmed];
    namesRef.current = next;
    setNames(next);
    setDraft("");
    setError(null);
  }, []);

  const removeName = useCallback((name: string) => {
    const next = namesRef.current.filter((existing) => existing !== name);
    namesRef.current = next;
    setNames(next);
    setError(null);
  }, []);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    if (!hasMinimumMetrics) {
      setError(`Choose at least ${MIN_METRICS} metrics.`);
      return;
    }
    finishing.current = true;
    setError(null);
    setBusy(true);
    try {
      await completeOnboarding(names);
    } catch {
      setError("Couldn’t finish setup. Try again.");
    } finally {
      finishing.current = false;
      setBusy(false);
    }
  }, [completeOnboarding, hasMinimumMetrics, names]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + space.xl, space.xxxl) },
      ]}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>Anvaya</Text>
      <Text style={styles.tagline}>Life beside the Panchang</Text>
      <Text style={styles.lead}>
        Rate a few personal measures each day beside today’s Tithi, Vaar, and
        Paksha. Local, fast, no account.
      </Text>

      <Text style={styles.section}>Your metrics</Text>
      <Text style={styles.hint}>
        Choose {MIN_METRICS}–{MAX_METRICS} things to rate daily. Rename or archive
        later; history stays.
      </Text>

      <View style={styles.chips}>
        {names.map((name) => (
          <Pressable
            key={name}
            disabled={busy}
            onPress={() => removeName(name)}
            style={({ pressed }) => [
              styles.chip,
              busy && styles.controlDisabled,
              pressed && !busy && styles.pressed,
            ]}
            accessibilityLabel={`Remove ${name}`}
          >
            <Text style={styles.chipText}>{name} ×</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          editable={!busy}
          onChangeText={(text) => {
            setDraft(text);
            if (error) setError(null);
          }}
          placeholder="Add a metric"
          maxLength={40}
          placeholderTextColor={colors.inkTertiary}
          style={styles.input}
          onSubmitEditing={() => addName(draft)}
          returnKeyType="done"
        />
        <Pressable
          disabled={busy}
          onPress={() => addName(draft)}
          style={({ pressed }) => [
            styles.addBtn,
            busy && styles.controlDisabled,
            pressed && !busy && styles.pressed,
          ]}
          accessibilityLabel="Add metric"
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.suggestions}>
        {SUGGESTIONS.filter((s) => !normalizedNames.has(s.toLowerCase())).map((s) => (
          <Pressable
            key={s}
            disabled={busy}
            onPress={() => addName(s)}
            style={({ pressed }) => [
              styles.suggest,
              busy && styles.controlDisabled,
              pressed && !busy && styles.pressed,
            ]}
          >
            <Text style={styles.suggestText}>+ {s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Location</Text>
      <Text style={styles.hint}>
        Used for accurate sunrise and Panchang. Deny to use Delhi as a fallback.
      </Text>

      <Pressable
        onPress={finish}
        disabled={busy}
        style={({ pressed }) => [
          styles.cta,
          (busy || !hasMinimumMetrics) && styles.ctaDisabled,
          pressed && !(busy || !hasMinimumMetrics) && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.ctaText}>Begin</Text>
        )}
      </Pressable>
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
    gap: space.md,
  },
  brand: {
    ...type.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  tagline: {
    ...type.label,
    color: colors.accent,
    marginTop: -space.sm,
  },
  lead: {
    ...type.body,
    color: colors.inkSecondary,
    marginBottom: space.lg,
  },
  section: {
    ...type.headline,
    color: colors.ink,
    marginTop: space.lg,
  },
  hint: {
    ...type.body,
    color: colors.inkSecondary,
  },
  error: {
    ...type.caption,
    color: colors.danger,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  chipText: {
    ...type.bodyMedium,
    color: colors.ink,
  },
  addRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  addBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: "center",
  },
  addBtnText: {
    ...type.bodyMedium,
    color: colors.surface,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  suggest: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestText: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  cta: {
    marginTop: space.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  controlDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    ...type.headline,
    color: colors.surface,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
