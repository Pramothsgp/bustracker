import { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, MapAvailable } from "@/components/SafeMapView";
import LeafletMap from "@/components/LeafletMap";
import type { LeafletMarker } from "@/components/LeafletMap";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { api } from "@/lib/api";
import { getTrackingSocket } from "@/lib/socket";
import { startBackgroundLocation, stopBackgroundLocation } from "@/lib/background-location";
import { SOCKET_EVENTS, COIMBATORE_CENTER } from "@bus/shared";

export default function ActiveTripScreen() {
  const { tripId, routeNumber } = useLocalSearchParams<{ tripId: string; routeNumber: string }>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const socketRef = useRef(getTrackingSocket());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();

    // Start background location tracking
    startBackgroundLocation(tripId).catch((err) => {
      console.error("Failed to start background location:", err);
      // Fallback: use foreground location
      startForegroundTracking(socket);
    });

    // Timer
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket.disconnect();
    };
  }, [tripId]);

  async function startForegroundTracking(socket: any) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      (loc) => {
        const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(pos);

        socket.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
          tripId,
          lat: pos.lat,
          lng: pos.lng,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        });
      }
    );
  }

  const handleEndTrip = async () => {
    Alert.alert("End Trip", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Trip",
        style: "destructive",
        onPress: async () => {
          setEnding(true);
          try {
            await stopBackgroundLocation();
            await api.post(`/trips/${tripId}/end`);
            router.replace("/(driver)/dashboard");
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Failed to end trip");
            setEnding(false);
          }
        },
      },
    ]);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const initialRegion = {
    latitude: location?.lat ?? COIMBATORE_CENTER.lat,
    longitude: location?.lng ?? COIMBATORE_CENTER.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const leafletMarkers = useMemo<LeafletMarker[]>(() => {
    if (!location) return [];
    return [{
      id: "driver",
      lat: location.lat,
      lng: location.lng,
      title: "Your Bus",
      color: "#1d4ed8",
    }];
  }, [location]);

  return (
    <View className="flex-1 bg-white">
      {MapAvailable ? (
        <MapView
          className="flex-1"
          initialRegion={initialRegion}
          showsUserLocation
          followsUserLocation
        >
          {location && (
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              title="Your Bus"
              pinColor="#1d4ed8"
            />
          )}
        </MapView>
      ) : (
        <LeafletMap
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          markers={leafletMarkers}
          showsUserLocation
        />
      )}

      <View className="border-t border-gray-200 bg-white p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">Route {routeNumber}</Text>
            <Text className="text-2xl font-bold tabular-nums text-gray-900">
              {formatTime(elapsed)}
            </Text>
          </View>
          <View className="items-center rounded-full bg-green-100 px-4 py-2">
            <View className="h-3 w-3 rounded-full bg-green-500" />
            <Text className="mt-1 text-xs font-medium text-green-700">LIVE</Text>
          </View>
        </View>

        <TouchableOpacity
          className="rounded-xl bg-red-600 py-4"
          onPress={handleEndTrip}
          disabled={ending}
        >
          <Text className="text-center text-lg font-semibold text-white">
            {ending ? "Ending..." : "End Trip"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
