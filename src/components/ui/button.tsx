import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

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

  const content = busy ? (
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
  );

  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      pressScale={0.98}
      style={[
        styles.base,
        variant === "tonal" && styles.tonal,
        variant === "ghost" && styles.ghost,
        variant === "filled" && styles.filledShadow,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {variant === "filled" ? (
        <LinearGradient
          colors={[colors.accent, colors.accentDeep]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fillGradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fillGradient: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  filledShadow: {
    boxShadow: elevation.card,
  },
  tonal: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.xl,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.xl,
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
