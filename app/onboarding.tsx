import { useCallback, useRef, useState } from "react";
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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [names, setNames] = useState<string[]>(["Energy", "Focus", "Calm"]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);

  const addName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNames((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setDraft("");
  }, []);

  const removeName = useCallback((name: string) => {
    setNames((prev) => prev.filter((n) => n !== name));
  }, []);

  const finish = useCallback(async () => {
    if (names.length === 0 || finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      await completeOnboarding(names);
    } finally {
      finishing.current = false;
      setBusy(false);
    }
  }, [completeOnboarding, names]);

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
        Choose 2–5 things to rate daily. Rename or archive later; history stays.
      </Text>

      <View style={styles.chips}>
        {names.map((name) => (
          <Pressable
            key={name}
            onPress={() => removeName(name)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            accessibilityLabel={`Remove ${name}`}
          >
            <Text style={styles.chipText}>{name} ×</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a metric"
          placeholderTextColor={colors.inkTertiary}
          style={styles.input}
          onSubmitEditing={() => addName(draft)}
          returnKeyType="done"
        />
        <Pressable
          onPress={() => addName(draft)}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          accessibilityLabel="Add metric"
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.suggestions}>
        {SUGGESTIONS.filter((s) => !names.includes(s)).map((s) => (
          <Pressable
            key={s}
            onPress={() => addName(s)}
            style={({ pressed }) => [styles.suggest, pressed && styles.pressed]}
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
        disabled={busy || names.length === 0}
        style={({ pressed }) => [
          styles.cta,
          (busy || names.length === 0) && styles.ctaDisabled,
          pressed && !(busy || names.length === 0) && styles.pressed,
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
  ctaText: {
    ...type.headline,
    color: colors.surface,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
