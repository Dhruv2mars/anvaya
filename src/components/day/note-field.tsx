import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

type Props = {
  dayKey: string;
  value: string;
  onCommit: (note: string) => void;
};

/** Parent should `key={dayKey}` so this remounts cleanly on day change. */
export function NoteField({ dayKey: _dayKey, value, onCommit }: Props) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(value);
  const committedValueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const pendingCommitRef = useRef(false);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const flushCommit = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!pendingCommitRef.current) return;

    pendingCommitRef.current = false;
    const next = draftRef.current;
    if (next === committedValueRef.current) return;

    committedValueRef.current = next;
    onCommitRef.current(next);
  }, []);

  useEffect(
    () => () => {
      flushCommit();
    },
    [flushCommit]
  );

  const scheduleCommit = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingCommitRef.current = true;
    timerRef.current = setTimeout(() => {
      flushCommit();
    }, 400);
  };

  return (
    <View style={[styles.card, focused && styles.cardFocused]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Note</Text>
        <Text style={styles.count}>{draft.length}/280</Text>
      </View>
      <TextInput
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          draftRef.current = text;
          scheduleCommit(text);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          flushCommit();
        }}
        placeholder="One line for the day"
        placeholderTextColor={colors.inkTertiary}
        maxLength={280}
        multiline
        returnKeyType="done"
        onSubmitEditing={flushCommit}
        style={styles.input}
        accessibilityLabel="Day note"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: space.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
    boxShadow: elevation.card,
  },
  cardFocused: {
    borderColor: colors.accent,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  label: {
    ...type.eyebrow,
    color: colors.inkSecondary,
  },
  count: {
    ...type.caption,
    color: colors.inkTertiary,
    fontVariant: ["tabular-nums"],
  },
  input: {
    ...type.body,
    color: colors.ink,
    padding: 0,
    minHeight: 30,
  },
});
