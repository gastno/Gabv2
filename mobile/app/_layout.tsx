import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.ink, fontWeight: "600" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ title: "Book a visit", presentation: "modal" }} />
      </Stack>
    </>
  );
}
