import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/src/hooks/app-store";
import { colors } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { ready, onboardingComplete, error, refresh } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onOnboarding = segments[0] === "onboarding";
    if (!onboardingComplete && !onOnboarding) {
      router.replace("/onboarding");
    } else if (onboardingComplete && onOnboarding) {
      router.replace("/");
    }
  }, [ready, onboardingComplete, segments, router]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.boot}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry startup" onPress={() => void refresh()} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={styles.boot} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
    padding: 24,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
  },
  retry: {
    marginTop: 16,
    minHeight: 48,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryText: {
    color: colors.surface,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
});
