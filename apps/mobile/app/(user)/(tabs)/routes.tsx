import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/lib/api";

interface RouteItem {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
}

export default function RoutesScreen() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<RouteItem[]>("/routes")
      .then(setRoutes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mb-2 rounded-lg border border-gray-200 p-4"
            onPress={() => router.push(`/(user)/route/${item.id}`)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Text className="font-bold text-blue-700">{item.routeNumber}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {item.origin}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    to {item.destination}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
