import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";

export default function MetricsScreen() {
  const {
    allMetrics,
    addMetric,
    renameMetric,
    archiveMetric,
    restoreMetric,
    reorderMetrics,
  } = useApp();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const active = allMetrics.filter((m) => m.archivedAt == null);
  const archived = allMetrics.filter((m) => m.archivedAt != null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Metrics</Text>
      <Text style={styles.lead}>
        Create, rename, reorder, archive. Archiving hides a metric from Today but
        keeps every past rating.
      </Text>

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="New metric"
          placeholderTextColor={colors.inkTertiary}
          style={styles.input}
          onSubmitEditing={async () => {
            if (!draft.trim()) return;
            await addMetric(draft);
            setDraft("");
          }}
        />
        <Pressable
          style={styles.addBtn}
          onPress={async () => {
            if (!draft.trim()) return;
            await addMetric(draft);
            setDraft("");
          }}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Active</Text>
      {active.length === 0 ? (
        <Text style={styles.empty}>No active metrics.</Text>
      ) : (
        active.map((m, index) => (
          <View key={m.id} style={styles.row}>
            {editingId === m.id ? (
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[styles.input, styles.flex]}
                autoFocus
                onBlur={async () => {
                  if (editName.trim() && editName !== m.name) {
                    await renameMetric(m.id, editName);
                  }
                  setEditingId((current) => (current === m.id ? null : current));
                }}
                onSubmitEditing={async () => {
                  if (editName.trim()) await renameMetric(m.id, editName);
                  setEditingId((current) => (current === m.id ? null : current));
                }}
              />
            ) : (
              <Pressable
                style={styles.flex}
                onPress={() => {
                  setEditingId(m.id);
                  setEditName(m.name);
                }}
              >
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.hint}>Tap to rename</Text>
              </Pressable>
            )}
            <View style={styles.actions}>
              <Pressable
                disabled={index === 0}
                onPress={async () => {
                  const ids = active.map((x) => x.id);
                  const next = [...ids];
                  const tmp = next[index - 1]!;
                  next[index - 1] = next[index]!;
                  next[index] = tmp;
                  await reorderMetrics(next);
                }}
                style={styles.iconBtn}
                accessibilityLabel={`Move ${m.name} up`}
              >
                <Text style={styles.iconText}>↑</Text>
              </Pressable>
              <Pressable
                disabled={index === active.length - 1}
                onPress={async () => {
                  const ids = active.map((x) => x.id);
                  const next = [...ids];
                  const tmp = next[index + 1]!;
                  next[index + 1] = next[index]!;
                  next[index] = tmp;
                  await reorderMetrics(next);
                }}
                style={styles.iconBtn}
                accessibilityLabel={`Move ${m.name} down`}
              >
                <Text style={styles.iconText}>↓</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Archive metric?",
                    `"${m.name}" will leave Today. Past ratings stay.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Archive",
                        style: "destructive",
                        onPress: () => void archiveMetric(m.id),
                      },
                    ]
                  );
                }}
                style={styles.iconBtn}
                accessibilityLabel={`Archive ${m.name}`}
              >
                <Text style={[styles.iconText, styles.danger]}>Archive</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {archived.length > 0 ? (
        <>
          <Text style={styles.section}>Archived</Text>
          {archived.map((m) => (
            <View key={m.id} style={styles.row}>
              <Text style={[styles.name, styles.muted]}>{m.name}</Text>
              <Pressable onPress={() => void restoreMetric(m.id)}>
                <Text style={styles.restore}>Restore</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.md,
  },
  title: { ...type.title, color: colors.ink, marginTop: space.sm },
  lead: { ...type.body, color: colors.inkSecondary },
  section: { ...type.label, color: colors.inkSecondary, marginTop: space.lg },
  addRow: { flexDirection: "row", gap: space.sm },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  flex: { flex: 1 },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: "center",
  },
  addBtnText: { ...type.bodyMedium, color: colors.surface },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  name: { ...type.headline, color: colors.ink },
  hint: { ...type.caption, color: colors.inkTertiary },
  muted: { color: colors.inkTertiary },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { ...type.caption, color: colors.inkSecondary },
  danger: { color: colors.danger },
  restore: { ...type.bodyMedium, color: colors.accent },
  empty: { ...type.body, color: colors.inkSecondary },
});
