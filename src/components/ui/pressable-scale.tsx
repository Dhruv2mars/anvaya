import type { ReactNode } from "react";
import {
  Pressable,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
};

export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  hitSlop,
}: Props) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { opacity: 0.9, transform: [{ scale: 0.97 }] } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}
