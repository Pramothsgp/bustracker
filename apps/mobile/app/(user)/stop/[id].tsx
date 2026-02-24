import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/lib/api";

interface StopDetail {
  id: string;
  name: string;
  nameTa: string | null;
  lat: number | null;
  lng: number | null;
  routes: { routeId: string; routeNumber: string; routeName: string; sequence: number }[];
}

export default function StopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stop, setStop] = useState<StopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<StopDetail>(`/stops/${id}`)
      .then(setStop)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !stop) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900">{stop.name}</Text>
      {stop.nameTa && <Text className="text-base text-gray-500">{stop.nameTa}</Text>}

      {stop.lat && stop.lng && (
        <Text className="mt-1 text-sm text-green-600">
          {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
        </Text>
      )}

      <Text className="mb-2 mt-6 font-semibold text-gray-900">
        Routes ({stop.routes?.length || 0})
      </Text>

      {stop.routes?.map((r) => (
        <TouchableOpacity
          key={r.routeId}
          className="mb-2 rounded-lg border border-gray-200 p-3"
          onPress={() => router.push(`/(user)/route/${r.routeId}`)}
        >
          <View className="flex-row items-center">
            <View className="mr-3 rounded-md bg-blue-100 px-2 py-1">
              <Text className="font-bold text-blue-700">{r.routeNumber}</Text>
            </View>
            <Text className="flex-1 text-sm text-gray-700">{r.routeName}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
