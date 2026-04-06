import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "driver") {
      router.replace("/(driver)/dashboard");
      return;
    }

    if (user.role === "conductor") {
      router.replace("/(conductor)/dashboard");
      return;
    }

    router.replace("/(user)/(tabs)/map");
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
