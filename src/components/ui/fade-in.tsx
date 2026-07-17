import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { motion } from "@/src/theme/tokens";

type Props = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Occasional enter — skipped when Reduce Motion is on. */
export function FadeIn({ children, delay = 0, style }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(motion.normal)}
      style={[styles.wrap, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
});
