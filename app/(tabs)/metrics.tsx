import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";

export default function MetricsScreen() {
  const {
    allMetrics,
    addMetric,
    renameMetric,
    archiveMetric,
    deleteArchivedMetric,
    restoreMetric,
    reorderMetrics,
  } = useApp();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const active = allMetrics.filter((m) => m.archivedAt == null);
  const archived = allMetrics.filter((m) => m.archivedAt != null);

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>Measures</Text>
        <Text style={styles.lead}>
          Create, rename, reorder, and archive. Archived measures keep their
          history until you permanently delete them.
        </Text>
      </FadeIn>

      <FadeIn delay={40}>
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="New measure"
            placeholderTextColor={colors.inkTertiary}
            style={styles.input}
            onSubmitEditing={async () => {
              if (!draft.trim()) return;
              await addMetric(draft);
              setDraft("");
            }}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add measure"
            style={styles.addBtn}
            onPress={async () => {
              if (!draft.trim()) return;
              await addMetric(draft);
              setDraft("");
            }}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </PressableScale>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Text style={styles.section}>Active</Text>
        {active.length === 0 ? (
          <Text style={styles.empty}>No active measures.</Text>
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
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${m.name}`}
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
                  accessibilityRole="button"
                  disabled={index === 0}
                  accessibilityState={{ disabled: index === 0 }}
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
                  accessibilityRole="button"
                  disabled={index === active.length - 1}
                  accessibilityState={{ disabled: index === active.length - 1 }}
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
                  accessibilityRole="button"
                  onPress={() => {
                    Alert.alert(
                      "Archive measure?",
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
      </FadeIn>

      {archived.length > 0 ? (
        <FadeIn delay={100}>
          <Text style={styles.section}>Archived</Text>
          {archived.map((m) => (
            <View key={m.id} style={styles.row}>
              <Text style={[styles.name, styles.muted, styles.flex]}>{m.name}</Text>
              <View style={styles.actions}>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => void restoreMetric(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Restore ${m.name}`}
                >
                  <Text style={styles.restore}>Restore</Text>
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${m.name} permanently`}
                  onPress={() => {
                    Alert.alert(
                      "Delete measure permanently?",
                      `“${m.name}” and all of its past ratings will be permanently deleted. This cannot be undone.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete permanently",
                          style: "destructive",
                          onPress: () => void deleteArchivedMetric(m.id),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.iconText, styles.danger]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </FadeIn>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.title, color: colors.ink },
  lead: { ...type.body, color: colors.inkSecondary },
  section: { ...type.label, color: colors.inkSecondary, marginTop: space.md },
  addRow: { flexDirection: "row", gap: space.sm },
  input: {
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
  flex: { flex: 1 },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    minHeight: 48,
  },
  addBtnText: { ...type.bodyMedium, color: colors.accentOn },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
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
  empty: { ...type.body, color: colors.inkSecondary, marginTop: space.sm },
});
