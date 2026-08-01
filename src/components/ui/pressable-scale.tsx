import type { ReactNode } from "react";
import {
  Pressable,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { springs } from "@/src/theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
  /** Scale on press. Set 1 to disable. */
  pressScale?: number;
};

/**
 * Physical press feedback: spring-driven scale that responds on touch-down,
 * releases on touch-up, and self-interrupts cleanly. Reduced Motion honored.
 * Layout and transform live on one node, so flex rows/columns stay intact.
 */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = onPress ? "button" : undefined,
  accessibilityState,
  hitSlop,
  pressScale = 0.96,
}: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => {
        if (disabled) return;
        // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write is the intended animation API
        opacity.value = withSpring(0.94, springs.snappy);
        if (!reduceMotion && pressScale !== 1) {
          // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write is the intended animation API
          scale.value = withSpring(pressScale, springs.snappy);
        }
      }}
      onPressOut={() => {
        if (disabled) return;
        // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write is the intended animation API
        opacity.value = withSpring(1, springs.snappy);
        if (!reduceMotion && pressScale !== 1) {
          // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write is the intended animation API
          scale.value = withSpring(1, springs.snappy);
        }
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
