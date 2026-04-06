import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type ActiveTrip = {
  id: string;
  routeId: string;
  busId: string;
} | null;

export default function ConductorDashboard() {
  const { user, logout } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip>(null);
  const [loading, setLoading] = useState(true);

  const [allActiveTrips, setAllActiveTrips] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveTrip();
  }, []);

  const fetchActiveTrip = async () => {
    try {
      setLoading(true);
      const data = await api.get<ActiveTrip>("/trips/active");
      if (data) {
        setActiveTrip(data);
      } else {
        await fetchAllActiveTrips();
      }
    } catch (err) {
      console.log("No active trip found");
      fetchAllActiveTrips();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActiveTrips = async () => {
    try {
      setLoadingAll(true);
      const data = await api.get<any[]>("/trips/all-active");
      setAllActiveTrips(data || []);
    } catch (err) {
      console.error("Failed to fetch all active trips", err);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleJoinTrip = async (trip: any) => {
    setJoiningId(trip.id);
    try {
      await api.post("/trips/start", { busId: trip.busId, routeId: trip.routeId });
      await fetchActiveTrip();
    } catch (err) {
      console.error("Failed to join trip", err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-white p-6">
      <View className="mb-8 mt-4 items-center">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="card" size={40} color="#1d4ed8" />
        </View>
        <Text className="text-xl font-bold text-gray-900">{user?.name || "Conductor"}</Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" className="mb-4" />
      ) : activeTrip ? (
        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl bg-green-600 p-5"
          onPress={() =>
            router.push({
              pathname: "/(conductor)/trip/ticketing",
              params: {
                tripId: activeTrip.id,
                routeId: activeTrip.routeId,
                busId: activeTrip.busId,
              },
            })
          }
        >
          <Ionicons name="ticket" size={32} color="white" />
          <View className="ml-4">
            <Text className="text-lg font-semibold text-white">Issue Tickets</Text>
            <Text className="text-sm text-green-200">Join your assigned trip session</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="mb-6 rounded-xl bg-gray-50 p-6 border border-gray-200">
          <Text className="text-center font-bold text-gray-800 text-lg mb-2">Available Trips for Conductor</Text>
          <Text className="text-center text-sm text-gray-500 mb-4">Select an active trip to join and manage ticketing.</Text>
          
          {loadingAll ? (
            <ActivityIndicator size="small" color="#1d4ed8" />
          ) : allActiveTrips.length === 0 ? (
            <Text className="text-center italic text-gray-400">No active trips currently available.</Text>
          ) : (
            <View className="space-y-3">
              {allActiveTrips.map((trip) => (
                <View key={trip.id} className="flex-row items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <View>
                    <Text className="font-bold text-gray-900">Route {trip.routeNumber}</Text>
                    <Text className="text-xs text-gray-500">Bus: {trip.busRegistration}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleJoinTrip(trip)}
                    disabled={joiningId === trip.id}
                    className={`px-4 py-2 rounded-lg ${joiningId === trip.id ? "bg-gray-400" : "bg-blue-600"}`}
                  >
                    {joiningId === trip.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-medium text-sm">Join</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={fetchActiveTrip} className="mt-6 bg-blue-100 rounded py-2 px-4 shadow-sm border border-blue-200">
            <Text className="text-center text-blue-700 font-semibold">Refresh List</Text>
          </TouchableOpacity>
        </View>
      )}

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
