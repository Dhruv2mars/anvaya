import { useRef, useState } from "react";
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
  const dayRef = useRef(dayKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCommit = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (dayRef.current !== dayKey) return;
      if (next !== value) onCommit(next);
    }, 400);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Note</Text>
      <TextInput
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          scheduleCommit(text);
        }}
        onBlur={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (dayRef.current !== dayKey) return;
          if (draft !== value) onCommit(draft);
        }}
        placeholder="One line for the day"
        placeholderTextColor={colors.inkTertiary}
        maxLength={280}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (dayRef.current !== dayKey) return;
          if (draft !== value) onCommit(draft);
        }}
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
