import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandHeader } from "@/src/components/ui/brand-header";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";

const SUGGESTIONS = ["Energy", "Focus", "Calm", "Sleep", "Mood"];
const MIN_METRICS = 2;
const MAX_METRICS = 5;

export default function OnboardingScreen() {
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
      setError("Enter a measure name.");
      return;
    }

    const current = namesRef.current;
    if (current.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setError("That measure is already added.");
      return;
    }
    if (current.length >= MAX_METRICS) {
      setError(`Choose up to ${MAX_METRICS} measures.`);
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
      setError(`Choose at least ${MIN_METRICS} measures.`);
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
    <Screen>
      <FadeIn>
        <BrandHeader hero tagline="Notice your days beside the calendar." />
      </FadeIn>

      <FadeIn delay={60}>
        <Text style={styles.lead}>
          Rate a few personal measures each day next to today’s lunar and solar
          marks. Local, fast, no account.
        </Text>
      </FadeIn>

      <FadeIn delay={100}>
        <Text style={styles.section}>Your measures</Text>
        <Text style={styles.hint}>
          Choose {MIN_METRICS}–{MAX_METRICS} things to rate daily. Rename or archive
          later; history stays.
        </Text>

        <View style={styles.chips}>
          {names.map((name) => (
            <PressableScale
              key={name}
              disabled={busy}
              onPress={() => removeName(name)}
              style={[styles.chip, busy && styles.controlDisabled]}
              accessibilityLabel={`Remove ${name}`}
            >
              <Text style={styles.chipText}>{name} ×</Text>
            </PressableScale>
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
            placeholder="Add a measure"
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
            accessibilityLabel="Add measure"
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
            <PressableScale
              key={s}
              disabled={busy}
              onPress={() => addName(s)}
              style={[styles.suggest, busy && styles.controlDisabled]}
            >
              <Text style={styles.suggestText}>+ {s}</Text>
            </PressableScale>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={140}>
        <Text style={styles.section}>Location</Text>
        <Text style={styles.hint}>
          Used for accurate sunrise and day marks. Deny to use Delhi as a fallback.
        </Text>

        <Button
          label="Begin"
          onPress={() => void finish()}
          busy={busy}
          disabled={!hasMinimumMetrics}
          style={styles.cta}
        />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...type.body,
    color: colors.inkSecondary,
    marginBottom: space.sm,
  },
  section: {
    ...type.headline,
    color: colors.ink,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  hint: {
    ...type.body,
    color: colors.inkSecondary,
    marginBottom: space.md,
  },
  error: {
    ...type.caption,
    color: colors.danger,
    marginTop: space.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.md,
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
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 48,
  },
  addBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    minHeight: 48,
  },
  addBtnText: {
    ...type.bodyMedium,
    color: colors.surface,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.md,
  },
  suggest: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestText: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  cta: {
    marginTop: space.xl,
    alignSelf: "stretch",
  },
  controlDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
