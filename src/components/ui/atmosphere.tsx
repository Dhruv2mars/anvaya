import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/theme/tokens";

/**
 * Morning mist field — cool vertical wash, faint warm sunrise bloom in the
 * top-right corner. The product's one warm mark lives here, behind content.
 */
export function Atmosphere() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.bg, colors.bg, colors.bgDeep]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(196, 59, 46, 0.10)",
          "rgba(217, 106, 62, 0.05)",
          "rgba(217, 106, 62, 0)",
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.15, y: 0.85 }}
        style={styles.warmBloom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  warmBloom: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "88%",
    height: "52%",
  },
});
