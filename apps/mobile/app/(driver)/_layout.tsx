import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function DriverLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    if (user.role !== "driver") {
      router.replace("/");
    }
  }, [user, loading]);

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: "Driver Dashboard" }} />
      <Stack.Screen name="trip/start" options={{ title: "Start Trip" }} />
      <Stack.Screen name="trip/active" options={{ title: "Active Trip", headerBackVisible: false }} />
    </Stack>
  );
}
