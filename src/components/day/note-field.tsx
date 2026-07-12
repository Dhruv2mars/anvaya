import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  dayKey: string;
  value: string;
  onCommit: (note: string) => void;
};

/** Parent should `key={dayKey}` so this remounts cleanly on day change. */
export function NoteField({ dayKey, value, onCommit }: Props) {
  const [draft, setDraft] = useState(value);
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
    <View style={styles.wrap}>
      <Text style={styles.label}>Note</Text>
      <TextInput
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          draftRef.current = text;
          scheduleCommit(text);
        }}
        onBlur={flushCommit}
        placeholder="One line for the day"
        placeholderTextColor={colors.inkTertiary}
        maxLength={280}
        returnKeyType="done"
        onSubmitEditing={flushCommit}
        style={styles.input}
        accessibilityLabel="Day note"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  label: {
    ...type.label,
    color: colors.inkSecondary,
  },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 48,
  },
});
