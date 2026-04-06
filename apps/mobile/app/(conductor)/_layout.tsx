import { Stack } from "expo-router";

export default function ConductorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="trip/ticketing" />
    </Stack>
  );
}
