import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Atmosphere } from "@/src/components/ui/atmosphere";
import { colors, space } from "@/src/theme/tokens";

type ScreenProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
};

export function Screen({
  children,
  contentStyle,
  keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Atmosphere />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, space.sm) + space.sm,
            paddingBottom: space.xxxl + insets.bottom,
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
});
