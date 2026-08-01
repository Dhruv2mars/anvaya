import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BrandHeader } from "@/src/components/ui/brand-header";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";

const SUGGESTIONS = ["Energy", "Focus", "Calm", "Sleep", "Mood"];
const MIN_MEASURES = 2;
const MAX_MEASURES = 5;

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [names, setNames] = useState<string[]>(["Energy", "Focus", "Calm"]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);
  const namesRef = useRef(names);
  const hasMinimumMeasures = names.length >= MIN_MEASURES;
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
    if (current.length >= MAX_MEASURES) {
      setError(`Choose up to ${MAX_MEASURES} measures.`);
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
    if (!hasMinimumMeasures) {
      setError(`Choose at least ${MIN_MEASURES} measures.`);
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
  }, [completeOnboarding, hasMinimumMeasures, names]);

  return (
    <Screen>
      {/* Static hero — first paint must be instant, no entrance choreography. */}
      <View style={styles.hero}>
        <BrandHeader hero tagline="Notice your days beside the calendar." />
        <Text style={styles.lead}>
          Rate a few personal measures each day next to today’s lunar and solar
          marks. Local, fast, no account.
        </Text>
      </View>

      <FadeIn delay={120}>
        <Text style={styles.section}>Your measures</Text>
        <Text style={styles.hint}>
          Choose {MIN_MEASURES}–{MAX_MEASURES} things to rate daily. Rename or archive
          later; history stays.
        </Text>

        <View style={styles.chips}>
          {names.map((name) => (
            <PressableScale
              key={name}
              disabled={busy}
              onPress={() => removeName(name)}
              style={[styles.chip, busy && styles.controlDisabled]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${name}`}
              pressScale={0.92}
            >
              <Text style={styles.chipText}>{name}</Text>
              <Ionicons name="close" size={14} color={colors.accent} />
            </PressableScale>
          ))}
        </View>

        <View style={styles.addCard}>
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
          <PressableScale
            disabled={busy}
            onPress={() => addName(draft)}
            style={[styles.addBtn, busy && styles.controlDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            accessibilityLabel="Add measure"
            pressScale={0.9}
          >
            <Ionicons name="add" size={24} color={colors.accentOn} />
          </PressableScale>
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
              accessibilityRole="button"
              accessibilityLabel={`Add ${s}`}
              pressScale={0.94}
            >
              <Ionicons name="add" size={14} color={colors.inkSecondary} />
              <Text style={styles.suggestText}>{s}</Text>
            </PressableScale>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={200}>
        <Text style={styles.section}>Location</Text>
        <Text style={styles.hint}>
          Used for accurate sunrise and day marks at your place. If you skip
          permission, Delhi serves as a fallback.
        </Text>

        <Button
          label="Begin"
          onPress={() => void finish()}
          busy={busy}
          disabled={!hasMinimumMeasures}
          style={styles.cta}
        />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: space.lg,
    paddingTop: space.lg,
  },
  lead: {
    ...type.body,
    color: colors.inkSecondary,
  },
  section: {
    ...type.eyebrow,
    color: colors.inkSecondary,
    marginTop: space.sm,
  },
  hint: {
    ...type.body,
    color: colors.inkSecondary,
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
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    minHeight: 44,
  },
  chipText: {
    ...type.bodyMedium,
    color: colors.ink,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: space.lg,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: space.sm,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: space.sm,
    minHeight: 44,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.sm,
  },
  suggest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  suggestText: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  cta: {
    marginTop: space.md,
    alignSelf: "stretch",
  },
  controlDisabled: {
    opacity: 0.55,
  },
});
