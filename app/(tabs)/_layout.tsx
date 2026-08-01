import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@/src/theme/tokens";

/**
 * Native tab bar — liquid glass on iOS 26, Material 3 on Android.
 * Insets handled manually inside each Screen (disableAutomaticContentInsets)
 * so both platforms share one spacing rhythm.
 */
export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={colors.accent}
      minimizeBehavior="onScrollDown"
      backgroundColor={colors.bg}
      indicatorColor={colors.accentSoft}
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "sunrise", selected: "sunrise.fill" }}
          md="wb_sunny"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "calendar", selected: "calendar" }}
          md="calendar_month"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="measures" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Measures</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
          md="monitoring"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
