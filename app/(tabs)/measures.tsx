import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FadeIn } from "@/src/components/ui/fade-in";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

export default function MeasuresScreen() {
  const {
    allMeasures,
    addMeasure,
    renameMeasure,
    archiveMeasure,
    deleteArchivedMeasure,
    restoreMeasure,
    reorderMeasures,
  } = useApp();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const active = allMeasures.filter((m) => m.archivedAt == null);
  const archived = allMeasures.filter((m) => m.archivedAt != null);

  const reorder = async (index: number, delta: -1 | 1) => {
    const ids = active.map((x) => x.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    const tmp = next[target]!;
    next[target] = next[index]!;
    next[index] = tmp;
    await reorderMeasures(next);
  };

  const submitDraft = async () => {
    if (!draft.trim()) return;
    await addMeasure(draft);
    setDraft("");
  };

  return (
    <Screen>
      <FadeIn>
        <View style={styles.head}>
          <Text style={styles.title}>Measures</Text>
          <Text style={styles.lead}>
            The few things you rate daily. Tap a name to rename; history stays on
            archive.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.addCard}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="New measure, e.g. Focus"
            placeholderTextColor={colors.inkTertiary}
            style={styles.input}
            onSubmitEditing={() => void submitDraft()}
            returnKeyType="done"
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add measure"
            style={styles.addBtn}
            pressScale={0.9}
            onPress={() => void submitDraft()}
          >
            <Ionicons name="add" size={26} color={colors.accentOn} />
          </PressableScale>
        </View>
      </FadeIn>

      <FadeIn delay={110}>
        <Text style={styles.eyebrow}>Active</Text>
        {active.length === 0 ? (
          <Text style={styles.empty}>No active measures.</Text>
        ) : (
          <View style={styles.card}>
            {active.map((m, index) => (
              <View
                key={m.id}
                style={[styles.row, index < active.length - 1 && styles.rowDivider]}
              >
                {editingId === m.id ? (
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.inlineInput, styles.flex]}
                    autoFocus
                    onBlur={async () => {
                      if (editName.trim() && editName !== m.name) {
                        await renameMeasure(m.id, editName);
                      }
                      setEditingId((current) => (current === m.id ? null : current));
                    }}
                    onSubmitEditing={async () => {
                      if (editName.trim()) await renameMeasure(m.id, editName);
                      setEditingId((current) => (current === m.id ? null : current));
                    }}
                  />
                ) : (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Rename ${m.name}`}
                    style={styles.nameHit}
                    pressScale={0.99}
                    onPress={() => {
                      setEditingId(m.id);
                      setEditName(m.name);
                    }}
                  >
                    <Text style={styles.name}>{m.name}</Text>
                    <Text style={styles.hint}>Tap to rename</Text>
                  </PressableScale>
                )}
                <View style={styles.actions}>
                  <PressableScale
                    accessibilityRole="button"
                    disabled={index === 0}
                    accessibilityState={{ disabled: index === 0 }}
                    onPress={() => void reorder(index, -1)}
                    style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                    accessibilityLabel={`Move ${m.name} up`}
                    pressScale={0.85}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={18}
                      color={index === 0 ? colors.inkTertiary : colors.inkSecondary}
                    />
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    disabled={index === active.length - 1}
                    accessibilityState={{ disabled: index === active.length - 1 }}
                    onPress={() => void reorder(index, 1)}
                    style={[
                      styles.iconBtn,
                      index === active.length - 1 && styles.iconBtnDisabled,
                    ]}
                    accessibilityLabel={`Move ${m.name} down`}
                    pressScale={0.85}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={
                        index === active.length - 1
                          ? colors.inkTertiary
                          : colors.inkSecondary
                      }
                    />
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    onPress={() => {
                      Alert.alert(
                        "Archive measure?",
                        `“${m.name}” will leave Today. Past ratings stay.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Archive",
                            style: "destructive",
                            onPress: () => void archiveMeasure(m.id),
                          },
                        ]
                      );
                    }}
                    style={styles.iconBtn}
                    accessibilityLabel={`Archive ${m.name}`}
                    pressScale={0.85}
                  >
                    <Ionicons name="archive-outline" size={17} color={colors.danger} />
                  </PressableScale>
                </View>
              </View>
            ))}
          </View>
        )}
      </FadeIn>

      {archived.length > 0 ? (
        <FadeIn delay={150}>
          <Text style={styles.eyebrow}>Archived</Text>
          <View style={[styles.card, styles.cardMuted]}>
            {archived.map((m, index) => (
              <View
                key={m.id}
                style={[styles.row, index < archived.length - 1 && styles.rowDivider]}
              >
                <Text style={[styles.name, styles.muted, styles.flex]}>{m.name}</Text>
                <View style={styles.actions}>
                  <PressableScale
                    style={styles.iconBtn}
                    onPress={() => void restoreMeasure(m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Restore ${m.name}`}
                    pressScale={0.85}
                  >
                    <Ionicons name="arrow-undo-outline" size={17} color={colors.accent} />
                  </PressableScale>
                  <PressableScale
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${m.name} permanently`}
                    pressScale={0.85}
                    onPress={() => {
                      Alert.alert(
                        "Delete measure permanently?",
                        `“${m.name}” and all of its past ratings will be permanently deleted. This cannot be undone.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete permanently",
                            style: "destructive",
                            onPress: () => void deleteArchivedMeasure(m.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  </PressableScale>
                </View>
              </View>
            ))}
          </View>
        </FadeIn>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  title: { ...type.pageTitle, color: colors.ink },
  lead: { ...type.body, color: colors.inkSecondary },
  eyebrow: { ...type.eyebrow, color: colors.inkSecondary },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: space.lg,
    paddingRight: 6,
    paddingVertical: 6,
    boxShadow: elevation.card,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: space.lg,
    boxShadow: elevation.card,
  },
  cardMuted: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  flex: { flex: 1 },
  nameHit: {
    flex: 1,
    gap: 1,
  },
  name: { ...type.headline, color: colors.ink },
  hint: { ...type.caption, color: colors.inkTertiary },
  inlineInput: {
    ...type.headline,
    color: colors.ink,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  muted: { color: colors.inkTertiary },
  actions: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  iconBtnDisabled: {
    opacity: 0.35,
    backgroundColor: "transparent",
  },
  empty: { ...type.body, color: colors.inkSecondary },
});
