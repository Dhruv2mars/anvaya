import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme/tokens";

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Text
        style={[
          styles.icon,
          { color: focused ? colors.accent : colors.inkTertiary },
        ]}
      >
        {glyph}
      </Text>
      {focused ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: focused ? "Manrope_600SemiBold" : "Manrope_500Medium",
        fontSize: 11,
        color: focused ? colors.accent : colors.inkTertiary,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => <TabIcon glyph="◎" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => <TabIcon glyph="☰" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel label="History" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: "Metrics",
          tabBarIcon: ({ focused }) => <TabIcon glyph="◇" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Metrics" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon glyph="⚙" focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 28,
  },
  icon: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: "Manrope_600SemiBold",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  dotSpacer: {
    width: 4,
    height: 4,
  },
});
