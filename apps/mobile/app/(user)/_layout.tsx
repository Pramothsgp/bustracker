import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="route/[id]" options={{ headerShown: true, title: "Route Details" }} />
      <Stack.Screen name="bus/[id]" options={{ headerShown: true, title: "Bus Details" }} />
      <Stack.Screen name="stop/[id]" options={{ headerShown: true, title: "Stop Details" }} />
    </Stack>
  );
}
