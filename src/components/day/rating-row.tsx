import { StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from "react-native-reanimated";
import { PressableScale } from "@/src/components/ui/pressable-scale";
import { colors, radius, springs, type } from "@/src/theme/tokens";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  onClear?: () => void;
};

/**
 * Tactile notch strip — five press segments over a spring-driven fill.
 * Tap the current value again to clear. Light haptic on commit.
 */
export function RatingRow({ value, onChange, onClear }: Props) {
  const trackWidth = useSharedValue(0);
  const selected = value ?? 0;

  const fillStyle = useAnimatedStyle(() => ({
    width: withSpring((trackWidth.value * selected) / 5, springs.gentle),
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="adjustable"
      onLayout={(e) => {
        trackWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
      {[1, 2, 3, 4, 5].map((n) => {
        const reached = value !== null && n <= value;
        const isCurrent = value === n;
        return (
          <PressableScale
            key={n}
            accessibilityLabel={`Rate ${n} of 5${isCurrent ? ", selected — tap again to clear" : ""}`}
            accessibilityState={{ selected: isCurrent }}
            pressScale={0.92}
            style={styles.segment}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (value === n && onClear) onClear();
              else onChange(n);
            }}
          >
            {isCurrent ? (
              <Animated.View
                key={`pop-${n}`}
                entering={ZoomIn.duration(160).easing(
                  Easing.bezier(0.34, 1.4, 0.64, 1)
                )}
                style={styles.circle}
              />
            ) : null}
            <Text
              accessible={false}
              style={[
                styles.num,
                !reached && styles.numIdle,
                isCurrent && styles.numCurrent,
              ]}
            >
              {n}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accentSoft,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  circle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  num: {
    ...type.headline,
    fontVariant: ["tabular-nums"],
    color: colors.ink,
    textAlign: "center",
  },
  numIdle: {
    color: colors.inkTertiary,
  },
  numCurrent: {
    color: colors.accent,
    fontFamily: "Manrope_700Bold",
  },
});
