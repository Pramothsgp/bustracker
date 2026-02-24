import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: "Driver Dashboard" }} />
      <Stack.Screen name="trip/start" options={{ title: "Start Trip" }} />
      <Stack.Screen name="trip/active" options={{ title: "Active Trip", headerBackVisible: false }} />
    </Stack>
  );
}
