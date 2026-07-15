import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const { location, refreshLocation } = useApp();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const locationSource =
    location.source === "gps"
      ? "Current device location"
      : location.source === "cached"
        ? "Last known location"
        : "Delhi fallback";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.body}>
          {locationSource}
          {"\n"}
          Lat {location.latitude.toFixed(4)}, Lon {location.longitude.toFixed(4)}
        </Text>
        <Text style={styles.hint}>
          Used for sunrise and Panchang accuracy. Data stays on device. You can
          revoke access in system settings anytime.
        </Text>
        <Pressable
          disabled={updatingLocation}
          style={({ pressed }) => [
            styles.btn,
            updatingLocation && styles.btnDisabled,
            pressed && !updatingLocation && styles.pressed,
          ]}
          onPress={async () => {
            setUpdatingLocation(true);
            try {
              await refreshLocation();
            } finally {
              setUpdatingLocation(false);
            }
          }}
        >
          {updatingLocation ? (
            <ActivityIndicator color={colors.accentPressed} />
          ) : (
            <Text style={styles.btnText}>Update location</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Privacy</Text>
        <Text style={styles.body}>
          Anvaya is local-first. Ratings, notes, and metrics are stored only in
          SQLite on this device. No account. No cloud sync in this version.
          Location is used solely to compute astronomical Panchang for your place.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>About</Text>
        <Text style={styles.body}>
          Anvaya {Constants.expoConfig?.version ?? "1.0.0"}
          {"\n"}
          Hindu day boundaries follow local sunrise (Udaya). Panchang via Swiss
          Ephemeris–class astronomy (astronomy-engine).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  title: { ...type.title, color: colors.ink, marginTop: space.sm },
  block: {
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  label: { ...type.label, color: colors.inkSecondary },
  body: { ...type.body, color: colors.ink },
  hint: { ...type.caption, color: colors.inkTertiary },
  btn: {
    marginTop: space.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  btnText: { ...type.bodyMedium, color: colors.ink },
  btnDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
