import { useCallback, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "@/src/theme/tokens";

type Props = {
  children: ReactNode;
  delay?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Occasional enter — soft rise + fade driven on first focus, not on mount.
 * (Entering animations don't fire reliably inside pre-mounted native-tab
 * screens.) Skipped entirely when Reduce Motion is on.
 */
export function FadeIn({ children, delay = 0, offset = 16, style }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      if (progress.value === 1) return;
      const timer = setTimeout(() => {
        // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write is the intended animation API
        progress.value = withTiming(1, {
          duration: motion.slow,
          easing: Easing.bezier(...motion.easeOut),
        });
      }, delay);
      return () => clearTimeout(timer);
    }, [delay, progress])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[styles.wrap, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
});
