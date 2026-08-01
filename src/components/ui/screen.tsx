import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Atmosphere } from "@/src/components/ui/atmosphere";
import { colors, space } from "@/src/theme/tokens";

type ScreenProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
};

/**
 * Page scaffold: atmospheric backdrop, padded scroll content, and a
 * scroll-edge fade under the top system chrome so sliding content dissolves
 * instead of clipping into the status bar / Dynamic Island.
 */
export function Screen({
  children,
  contentStyle,
  keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeHeight = Math.max(insets.top, space.sm) + space.xxxl;

  return (
    <View style={styles.root}>
      <Atmosphere />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, space.sm) + space.md,
            paddingBottom:
              space.xxxl + 56 + insets.bottom,
            paddingLeft: space.xl + insets.left,
            paddingRight: space.xl + insets.right,
          },
          contentStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[
          colors.bg,
          colors.bg,
          "rgba(234, 239, 243, 0.55)",
          "rgba(234, 239, 243, 0.10)",
          "rgba(234, 239, 243, 0)",
        ]}
        locations={[0, 0.45, 0.68, 0.88, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edgeFade, { height: fadeHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    gap: space.lg,
  },
  edgeFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
