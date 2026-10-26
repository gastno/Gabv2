import { NativeTabs } from "expo-router/native-tabs";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      iconColor={{ default: colors.muted, selected: colors.accent }}
      labelStyle={{ color: colors.muted }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkle" md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
