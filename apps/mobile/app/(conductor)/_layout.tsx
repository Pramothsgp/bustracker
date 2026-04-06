import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function ConductorLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    if (user.role !== "conductor") {
      router.replace("/");
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="trip/ticketing" />
    </Stack>
  );
}
