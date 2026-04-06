import { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, MapAvailable } from "@/components/SafeMapView";
import LeafletMap from "@/components/LeafletMap";
import type { LeafletMarker } from "@/components/LeafletMap";
import { router } from "expo-router";
import * as Location from "expo-location";
import { api } from "@/lib/api";
import { getTrackingSocket } from "@/lib/socket";
import { SOCKET_EVENTS, COIMBATORE_CENTER } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

export default function MapScreen() {
  const mapRef = useRef<any>(null);
  const [buses, setBuses] = useState<Map<string, ActiveBusPosition>>(new Map());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === "granted") {
        Location.getCurrentPositionAsync({}).then((loc) => {
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        });
      }
    });

    // Load initial buses
    api.get<ActiveBusPosition[]>("/tracking/buses").then((data) => {
      const map = new Map<string, ActiveBusPosition>();
      data.forEach((b) => map.set(b.tripId, b));
      setBuses(map);
    }).catch(() => {});

    // Socket.IO for live updates
    const socket = getTrackingSocket();
    socket.connect();

    socket.on(SOCKET_EVENTS.BUS_MOVED, (data: ActiveBusPosition) => {
      setBuses((prev) => {
        const next = new Map(prev);
        next.set(data.tripId, data);
        return next;
      });
    });

    socket.on(SOCKET_EVENTS.BUS_STOPPED, (data: { tripId: string }) => {
      setBuses((prev) => {
        const next = new Map(prev);
        next.delete(data.tripId);
        return next;
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.BUS_MOVED);
      socket.off(SOCKET_EVENTS.BUS_STOPPED);
      socket.disconnect();
    };
  }, []);

  const busArray = Array.from(buses.values());

  // Leaflet markers (memoized to avoid re-renders)
  const leafletMarkers = useMemo<LeafletMarker[]>(
    () =>
      busArray.map((bus) => ({
        id: bus.tripId,
        lat: bus.lat,
        lng: bus.lng,
        title: `Route ${bus.routeNumber}`,
        description: bus.speed ? `${Math.round(bus.speed)} km/h` : "Active",
        color: "#1d4ed8",
      })),
    [busArray]
  );

  const initialRegion = {
    latitude: userLocation?.lat ?? COIMBATORE_CENTER.lat,
    longitude: userLocation?.lng ?? COIMBATORE_CENTER.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Use Leaflet WebView map when native maps aren't available (Expo Go)
  if (!MapAvailable) {
    return (
      <View className="flex-1">
        <LeafletMap
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          markers={leafletMarkers}
          showsUserLocation
          onMarkerPress={(id) => {
            const bus = buses.get(id);
            if (bus) router.push(`/(user)/bus/${bus.busId}`);
          }}
        />

        {/* Bottom overlay */}
        <View className="absolute bottom-4 left-4 right-4">
          <View className="rounded-xl bg-white p-4 shadow-lg">
            <Text className="text-sm font-medium text-gray-500">
              {busArray.length} buses active
            </Text>
            <TouchableOpacity
              className="mt-2 rounded-lg bg-blue-600 py-2"
              onPress={() => router.push("/(auth)/login")}
            >
              <Text className="text-center text-sm font-semibold text-white">
                Driver Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Native map (dev build / production)
  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {busArray.map((bus) => (
          <Marker
            key={bus.tripId}
            coordinate={{ latitude: bus.lat, longitude: bus.lng }}
            title={`Route ${bus.routeNumber}`}
            description={bus.speed ? `${bus.speed} km/h` : undefined}
            pinColor="#1d4ed8"
            onCalloutPress={() =>
              router.push(`/(user)/bus/${bus.busId}`)
            }
          />
        ))}
      </MapView>

      <View className="absolute bottom-4 left-4 right-4">
        <View className="rounded-xl bg-white p-4 shadow-lg">
          <Text className="text-sm font-medium text-gray-500">
            {busArray.length} buses active
          </Text>
          <TouchableOpacity
            className="mt-2 rounded-lg bg-blue-600 py-2"
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Driver Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
