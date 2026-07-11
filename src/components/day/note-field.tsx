import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Props = {
  value: string;
  onCommit: (note: string) => void;
};

export function NoteField({ value, onCommit }: Props) {
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focusedRef.current) setDraft(value);
  }, [value]);

  const scheduleCommit = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
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
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (draft !== value) onCommit(draft);
        }}
        placeholder="One line for the day"
        placeholderTextColor={colors.inkTertiary}
        maxLength={280}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
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
