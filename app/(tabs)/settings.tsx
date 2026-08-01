import { useEffect, useRef, useState } from "react";
import { AppState, Image, Linking, StyleSheet, Text, View } from "react-native";
import { PermissionStatus, type LocationPermissionResponse } from "expo-location";
import Constants from "expo-constants";
import { Button } from "@/src/components/ui/button";
import { FadeIn } from "@/src/components/ui/fade-in";
import { Screen } from "@/src/components/ui/screen";
import { useApp } from "@/src/hooks/app-store";
import { colors, elevation, radius, space, type } from "@/src/theme/tokens";

const brandIcon = require("../../assets/images/icon.png");

function getLocationPermissionPresentation(permission: LocationPermissionResponse) {
  if (permission.status === PermissionStatus.GRANTED) {
    return {
      blocked: false,
      actionLabel: "Update location",
      hint: "Used for sunrise and day-mark accuracy. Data stays on device. You can revoke access in system settings anytime.",
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
    hint: "Allow location for accurate sunrise and day marks at your current place.",
  };
}

export default function SettingsScreen() {
  const { location, locationPermission, refreshLocation } = useApp();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const waitingForSettings = useRef(false);
  const {
    blocked: permissionBlocked,
    actionLabel,
    hint: permissionHint,
  } = getLocationPermissionPresentation(locationPermission);
  const locationSource =
    location.source === "gps"
      ? locationPermission.android?.accuracy === "coarse"
        ? "Approximate device location"
        : "Current device location"
      : location.source === "cached"
        ? "Last known location"
        : "Delhi fallback";

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !waitingForSettings.current) return;
      waitingForSettings.current = false;
      setLocationError(null);
      setUpdatingLocation(true);
      void refreshLocation(false)
        .catch(() => setLocationError("Couldn’t update location. Try again."))
        .finally(() => setUpdatingLocation(false));
    });
    return () => sub.remove();
  }, [refreshLocation]);

  return (
    <Screen>
      <FadeIn>
        <View style={styles.head}>
          <Text style={styles.title}>Settings</Text>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Location</Text>
          <Text style={styles.bodyStrong}>{locationSource}</Text>
          <Text style={styles.coords}>
            {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
          </Text>
          <Text style={styles.hint}>{permissionHint}</Text>
          <Button
            label={actionLabel}
            variant="tonal"
            busy={updatingLocation}
            style={styles.btn}
            onPress={async () => {
              if (permissionBlocked) {
                waitingForSettings.current = true;
                setLocationError(null);
                try {
                  await Linking.openSettings();
                } catch {
                  waitingForSettings.current = false;
                  setLocationError("Couldn’t open system settings.");
                }
                return;
              }

              setLocationError(null);
              setUpdatingLocation(true);
              try {
                await refreshLocation(true);
              } catch {
                setLocationError("Couldn’t update location. Try again.");
              } finally {
                setUpdatingLocation(false);
              }
            }}
          />
          {locationError ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {locationError}
            </Text>
          ) : null}
        </View>
      </FadeIn>

      <FadeIn delay={110}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Privacy</Text>
          <Text style={styles.body}>
            Anvaya is local-first. Ratings, notes, and measures live only in
            SQLite on this device. No account. No cloud sync in this version.
            Location is used solely to compute sunrise-based day marks for your
            place.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>About</Text>
          <Text style={styles.body}>
            Day boundaries follow local sunrise at your longitude, not midnight
            on the device clock. Lunar and solar marks computed on device.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={210}>
        <View style={styles.footer}>
          <Image source={brandIcon} style={styles.footerMark} accessible={false} />
          <Text style={styles.footerText}>
            Anvaya {Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
          <Text style={styles.footerHint}>Your days, your rhythm</Text>
        </View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  title: { ...type.pageTitle, color: colors.ink },
  card: {
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: space.lg,
    boxShadow: elevation.card,
  },
  eyebrow: { ...type.eyebrow, color: colors.inkSecondary },
  body: { ...type.body, color: colors.ink },
  bodyStrong: { ...type.headline, color: colors.ink },
  coords: {
    ...type.caption,
    color: colors.inkTertiary,
    fontVariant: ["tabular-nums"],
  },
  hint: { ...type.caption, color: colors.inkTertiary },
  error: { ...type.caption, color: colors.danger },
  btn: {
    alignSelf: "flex-start",
    minHeight: 44,
    paddingHorizontal: space.lg,
  },
  footer: {
    alignItems: "center",
    gap: space.xs,
    paddingTop: space.md,
  },
  footerMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderCurve: "continuous",
    opacity: 0.9,
  },
  footerText: { ...type.label, color: colors.inkSecondary },
  footerHint: { ...type.caption, color: colors.inkTertiary },
});
