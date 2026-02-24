import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { api } from "@/lib/api";
import { COIMBATORE_CENTER } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

interface RouteDetail {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  stops: { id: string; name: string; lat: number | null; lng: number | null; sequence: number }[];
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [buses, setBuses] = useState<ActiveBusPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<RouteDetail>(`/routes/${id}`),
      api.get<ActiveBusPosition[]>(`/tracking/route/${id}`).catch(() => []),
    ])
      .then(([routeData, busData]) => {
        setRoute(routeData);
        setBuses(busData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !route) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  const geocodedStops = route.stops.filter((s) => s.lat && s.lng);
  const routeCoords = geocodedStops.map((s) => ({
    latitude: s.lat!,
    longitude: s.lng!,
  }));

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Map */}
      <View className="h-64">
        <MapView
          className="flex-1"
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: geocodedStops[0]?.lat ?? COIMBATORE_CENTER.lat,
            longitude: geocodedStops[0]?.lng ?? COIMBATORE_CENTER.lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor="#1d4ed8" strokeWidth={3} />
          )}
          {geocodedStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat!, longitude: stop.lng! }}
              title={stop.name}
              pinColor="#059669"
            />
          ))}
          {buses.map((bus) => (
            <Marker
              key={bus.tripId}
              coordinate={{ latitude: bus.lat, longitude: bus.lng }}
              title={`Bus ${bus.routeNumber}`}
              pinColor="#1d4ed8"
            />
          ))}
        </MapView>
      </View>

      {/* Route info */}
      <View className="p-4">
        <View className="flex-row items-center">
          <View className="mr-3 rounded-lg bg-blue-100 px-3 py-1">
            <Text className="text-lg font-bold text-blue-700">{route.routeNumber}</Text>
          </View>
          <Text className="flex-1 font-medium text-gray-900">{route.routeName}</Text>
        </View>

        {buses.length > 0 && (
          <View className="mt-3 rounded-lg bg-green-50 p-3">
            <Text className="font-medium text-green-800">{buses.length} bus(es) active</Text>
          </View>
        )}

        <Text className="mb-2 mt-4 font-semibold text-gray-900">
          Stops ({route.stops.length})
        </Text>

        {route.stops.map((stop, i) => (
          <View key={stop.id} className="flex-row items-center border-l-2 border-blue-200 py-2 pl-4">
            <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <Text className="text-xs font-bold text-blue-700">{i + 1}</Text>
            </View>
            <Text className={`flex-1 text-sm ${stop.lat ? "text-gray-900" : "text-gray-400"}`}>
              {stop.name}
            </Text>
            {stop.lat && <Text className="text-xs text-green-600">GPS</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
