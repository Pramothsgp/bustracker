import { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline, MapAvailable, PROVIDER_GOOGLE } from "@/components/SafeMapView";
import LeafletMap from "@/components/LeafletMap";
import type { LeafletMarker, LeafletPolyline } from "@/components/LeafletMap";
import { api } from "@/lib/api";
import { COIMBATORE_CENTER } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MIN = 140;
const SHEET_MAX = SCREEN_HEIGHT * 0.75;

interface RouteDetail {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  stops: { id: string; name: string; lat: number | null; lng: number | null; sequence: number }[];
}

// Fetch actual road geometry from OSRM for a list of waypoints
async function fetchRoadRoute(
  stops: { lat: number; lng: number }[]
): Promise<{ lat: number; lng: number }[]> {
  if (stops.length < 2) return stops;

  // OSRM has a limit of ~100 waypoints per request; batch if needed
  const MAX_WAYPOINTS = 100;
  const allCoords: { lat: number; lng: number }[] = [];

  for (let i = 0; i < stops.length; i += MAX_WAYPOINTS - 1) {
    const chunk = stops.slice(i, i + MAX_WAYPOINTS);
    if (chunk.length < 2) {
      allCoords.push(...chunk);
      break;
    }

    const coords = chunk.map((s) => `${s.lng},${s.lat}`).join(";");
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]) {
        const geojsonCoords = data.routes[0].geometry.coordinates as [number, number][];
        const segment = geojsonCoords.map(([lng, lat]) => ({ lat, lng }));
        // Avoid duplicating the join point
        if (allCoords.length > 0) segment.shift();
        allCoords.push(...segment);
      } else {
        // Fallback: straight lines for this chunk
        if (allCoords.length > 0) chunk.shift();
        allCoords.push(...chunk);
      }
    } catch {
      if (allCoords.length > 0) chunk.shift();
      allCoords.push(...chunk);
    }
  }

  return allCoords;
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [buses, setBuses] = useState<ActiveBusPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [roadPath, setRoadPath] = useState<{ lat: number; lng: number }[] | null>(null);

  const sheetHeight = useRef(new Animated.Value(SHEET_MIN)).current;
  const lastHeight = useRef(SHEET_MIN);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const newH = Math.max(SHEET_MIN, Math.min(SHEET_MAX, lastHeight.current - g.dy));
        sheetHeight.setValue(newH);
      },
      onPanResponderRelease: (_, g) => {
        const currentH = Math.max(SHEET_MIN, Math.min(SHEET_MAX, lastHeight.current - g.dy));
        // Snap to min or max
        const target = currentH > (SHEET_MIN + SHEET_MAX) / 2 ? SHEET_MAX : SHEET_MIN;
        lastHeight.current = target;
        Animated.spring(sheetHeight, {
          toValue: target,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

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

  const geocodedStops = route?.stops.filter((s) => s.lat && s.lng) ?? [];

  // Fetch actual road path when stops are available
  useEffect(() => {
    if (geocodedStops.length < 2) return;
    const waypoints = geocodedStops.map((s) => ({ lat: s.lat!, lng: s.lng! }));
    fetchRoadRoute(waypoints).then(setRoadPath).catch(() => {});
  }, [route]);

  const initialRegion = {
    latitude: geocodedStops[0]?.lat ?? COIMBATORE_CENTER.lat,
    longitude: geocodedStops[0]?.lng ?? COIMBATORE_CENTER.lng,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const leafletMarkers = useMemo<LeafletMarker[]>(() => {
    const stopMarkers = geocodedStops.map((s) => ({
      id: s.id,
      lat: s.lat!,
      lng: s.lng!,
      title: s.name,
      color: "#059669",
    }));
    const busMarkers = buses.map((b) => ({
      id: b.tripId,
      lat: b.lat,
      lng: b.lng,
      title: `Bus ${b.routeNumber}`,
      description: b.speed ? `${Math.round(b.speed)} km/h` : "Active",
      color: "#1d4ed8",
    }));
    return [...stopMarkers, ...busMarkers];
  }, [geocodedStops, buses]);

  const leafletPolylines = useMemo<LeafletPolyline[]>(() => {
    const coords = roadPath ?? geocodedStops.map((s) => ({ lat: s.lat!, lng: s.lng! }));
    if (coords.length < 2) return [];
    return [{
      id: "route",
      coordinates: coords,
      color: "#1d4ed8",
      weight: 4,
    }];
  }, [roadPath, geocodedStops]);

  if (loading || !route) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  const routeCoords = (roadPath ?? geocodedStops.map((s) => ({ lat: s.lat!, lng: s.lng! }))).map(
    (c) => ({ latitude: c.lat, longitude: c.lng })
  );

  return (
    <View className="flex-1">
      {/* Full-screen map */}
      <View className="flex-1">
        {MapAvailable ? (
          <MapView
            className="flex-1"
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
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
        ) : (
          <LeafletMap
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            markers={leafletMarkers}
            polylines={leafletPolylines}
          />
        )}
      </View>

      {/* Draggable bottom sheet */}
      <Animated.View
        style={{ height: sheetHeight }}
        className="rounded-t-2xl bg-white shadow-lg"
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} className="items-center pb-2 pt-3">
          <View className="h-1 w-10 rounded-full bg-gray-300" />
        </View>

        {/* Route header */}
        <View className="flex-row items-center px-4 pb-3">
          <View className="mr-3 rounded-lg bg-blue-100 px-3 py-1">
            <Text className="text-lg font-bold text-blue-700">{route.routeNumber}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900" numberOfLines={1}>{route.routeName}</Text>
            <Text className="text-xs text-gray-500">
              {route.stops.length} stops
              {buses.length > 0 ? ` · ${buses.length} bus(es) active` : ""}
            </Text>
          </View>
        </View>

        {/* Scrollable stops list */}
        <ScrollView className="flex-1 px-4" nestedScrollEnabled>
          {route.stops.map((stop, i) => (
            <View key={stop.id} className="flex-row items-center border-l-2 border-blue-200 py-2 pl-4">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <Text className="text-xs font-bold text-blue-700">{i + 1}</Text>
              </View>
              <Text
                className={`flex-1 text-sm ${stop.lat ? "text-gray-900" : "text-gray-400"}`}
                numberOfLines={1}
              >
                {stop.name}
              </Text>
              {stop.lat && <Text className="text-xs text-green-600">GPS</Text>}
            </View>
          ))}
          <View className="h-4" />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
