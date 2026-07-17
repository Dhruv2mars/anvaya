import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { colors, radius, space, type } from "@/src/theme/tokens";

type Variant = "filled" | "tonal" | "ghost";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
};

export function Button({
  label,
  onPress,
  disabled,
  busy,
  variant = "filled",
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || busy;

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        variant === "filled" && styles.filled,
        variant === "tonal" && styles.tonal,
        variant === "ghost" && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "filled" ? colors.accentOn : colors.accentPressed}
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "filled" && styles.labelFilled,
            variant === "tonal" && styles.labelTonal,
            variant === "ghost" && styles.labelGhost,
          ]}
        >
          {label}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filled: {
    backgroundColor: colors.accent,
  },
  tonal: {
    backgroundColor: colors.accentSoft,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...type.headline,
  },
  labelFilled: {
    color: colors.accentOn,
  },
  labelTonal: {
    color: colors.ink,
  },
  labelGhost: {
    color: colors.inkSecondary,
  },
});
