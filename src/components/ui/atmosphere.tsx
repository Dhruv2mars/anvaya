import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/theme/tokens";

/** Soft cool mist wash — atmospheric depth without flat fill. */
export function Atmosphere() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.bg, colors.bgDeep, colors.bg]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(196, 59, 46, 0.07)", "transparent", "rgba(220, 228, 235, 0.55)"]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 0.7 }}
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
    width: "70%",
    height: "42%",
  },
});
