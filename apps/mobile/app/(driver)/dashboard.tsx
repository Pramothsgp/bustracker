import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { Ionicons } from "@expo/vector-icons";

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-white p-6">
      <View className="mb-8 mt-4 items-center">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="person" size={40} color="#1d4ed8" />
        </View>
        <Text className="text-xl font-bold text-gray-900">{user?.name || "Driver"}</Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
      </View>

      <TouchableOpacity
        className="mb-4 flex-row items-center rounded-xl bg-blue-600 p-5"
        onPress={() => router.push("/(driver)/trip/start")}
      >
        <Ionicons name="play-circle" size={32} color="white" />
        <View className="ml-4">
          <Text className="text-lg font-semibold text-white">Start Trip</Text>
          <Text className="text-sm text-blue-200">Begin tracking your route</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="mb-4 flex-row items-center rounded-xl border border-gray-200 p-5"
        onPress={() => router.push("/(user)/(tabs)/map")}
      >
        <Ionicons name="map" size={32} color="#6b7280" />
        <View className="ml-4">
          <Text className="text-base font-medium text-gray-900">View Map</Text>
          <Text className="text-sm text-gray-500">See all active buses</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center rounded-xl border border-red-200 p-5"
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={32} color="#dc2626" />
        <View className="ml-4">
          <Text className="text-base font-medium text-red-600">Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
