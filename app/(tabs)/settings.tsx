import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PermissionStatus, type LocationPermissionResponse } from "expo-location";
import { useApp } from "@/src/hooks/app-store";
import { colors, radius, space, type } from "@/src/theme/tokens";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getLocationPermissionPresentation(permission: LocationPermissionResponse) {
  if (permission.status === PermissionStatus.GRANTED) {
    return {
      blocked: false,
      actionLabel: "Update location",
      hint: "Used for sunrise and Panchang accuracy. Data stays on device. You can revoke access in system settings anytime.",
    };
  }
  if (permission.status === PermissionStatus.DENIED && !permission.canAskAgain) {
    return {
      blocked: true,
      actionLabel: "Open settings",
      hint: "Location access is blocked. Open system settings to allow it, then return here.",
    };
  }
  if (permission.status === PermissionStatus.DENIED) {
    return {
      blocked: false,
      actionLabel: "Try location again",
      hint: "Location access was denied. You can try again or keep using the current fallback.",
    };
  }
  return {
    blocked: false,
    actionLabel: "Allow location",
    hint: "Allow location for accurate sunrise and Panchang calculations at your current place.",
  };
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { location, locationPermission, refreshLocation } = useApp();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const waitingForSettings = useRef(false);
  const {
    blocked: permissionBlocked,
    actionLabel,
    hint: permissionHint,
  } = getLocationPermissionPresentation(locationPermission);
  const locationSource =
    location.source === "gps"
      ? "Current device location"
      : location.source === "cached"
        ? "Last known location"
        : "Delhi fallback";

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !waitingForSettings.current) return;
      waitingForSettings.current = false;
      setUpdatingLocation(true);
      void refreshLocation(false).finally(() => setUpdatingLocation(false));
    });
    return () => sub.remove();
  }, [refreshLocation]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, space.sm) },
      ]}
      contentInsetAdjustmentBehavior="never"
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.body}>
          {locationSource}
          {"\n"}
          Lat {location.latitude.toFixed(4)}, Lon {location.longitude.toFixed(4)}
        </Text>
        <Text style={styles.hint}>{permissionHint}</Text>
        <Pressable
          disabled={updatingLocation}
          style={({ pressed }) => [
            styles.btn,
            updatingLocation && styles.btnDisabled,
            pressed && !updatingLocation && styles.pressed,
          ]}
          accessibilityRole="button"
          onPress={async () => {
            if (permissionBlocked) {
              waitingForSettings.current = true;
              await Linking.openSettings();
              return;
            }

            setUpdatingLocation(true);
            try {
              await refreshLocation(true);
            } finally {
              setUpdatingLocation(false);
            }
          }}
        >
          {updatingLocation ? (
            <ActivityIndicator color={colors.accentPressed} />
          ) : (
            <Text style={styles.btnText}>{actionLabel}</Text>
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
