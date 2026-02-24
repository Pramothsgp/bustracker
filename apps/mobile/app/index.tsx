import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(user)/(tabs)/map" />;
  }

  if (user.role === "driver") {
    return <Redirect href="/(driver)/dashboard" />;
  }

  return <Redirect href="/(user)/(tabs)/map" />;
}
