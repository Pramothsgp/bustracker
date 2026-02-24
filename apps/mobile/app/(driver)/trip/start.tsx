import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";

interface BusItem {
  id: string;
  registrationNumber: string;
  type: string;
  status: string;
}

interface RouteItem {
  id: string;
  routeNumber: string;
  routeName: string;
}

export default function StartTripScreen() {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([api.get<BusItem[]>("/buses"), api.get<RouteItem[]>("/routes")])
      .then(([busData, routeData]) => {
        setBuses(busData.filter((b) => b.status === "active"));
        setRoutes(routeData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (!selectedBus || !selectedRoute) return;
    setStarting(true);
    try {
      const trip = await api.post<any>("/trips/start", {
        busId: selectedBus,
        routeId: selectedRoute,
      });
      router.replace({
        pathname: "/(driver)/trip/active",
        params: { tripId: trip.id, routeNumber: trip.routeNumber },
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to start trip");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mb-3 text-lg font-semibold text-gray-900">Select Bus</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {buses.map((bus) => (
          <TouchableOpacity
            key={bus.id}
            className={`rounded-lg border px-4 py-3 ${
              selectedBus === bus.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
            }`}
            onPress={() => setSelectedBus(bus.id)}
          >
            <Text
              className={`font-medium ${
                selectedBus === bus.id ? "text-blue-700" : "text-gray-700"
              }`}
            >
              {bus.registrationNumber}
            </Text>
            <Text className="text-xs text-gray-400">{bus.type}</Text>
          </TouchableOpacity>
        ))}
        {buses.length === 0 && (
          <Text className="text-gray-400">No active buses available</Text>
        )}
      </View>

      <Text className="mb-3 text-lg font-semibold text-gray-900">Select Route</Text>
      <View className="mb-6">
        {routes.slice(0, 20).map((route) => (
          <TouchableOpacity
            key={route.id}
            className={`mb-2 rounded-lg border p-3 ${
              selectedRoute === route.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
            }`}
            onPress={() => setSelectedRoute(route.id)}
          >
            <View className="flex-row items-center">
              <View className="mr-3 rounded bg-blue-100 px-2 py-0.5">
                <Text className="font-bold text-blue-700">{route.routeNumber}</Text>
              </View>
              <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                {route.routeName}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 ${
          selectedBus && selectedRoute ? "bg-blue-600" : "bg-gray-300"
        }`}
        onPress={handleStart}
        disabled={!selectedBus || !selectedRoute || starting}
      >
        <Text className="text-center text-lg font-semibold text-white">
          {starting ? "Starting..." : "Start Trip"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
