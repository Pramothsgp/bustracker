import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";

type Stop = {
  id: string;
  name: string;
  sequence: number;
};

type RouteData = {
  id: string;
  routeNumber: string;
  stops: Stop[];
};

export default function ConductorTicketingScreen() {
  const { tripId, routeId } = useLocalSearchParams<{ tripId: string; routeId: string }>();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentPassengers, setCurrentPassengers] = useState(0);

  const [startStopId, setStartStopId] = useState<string | null>(null);
  const [endStopId, setEndStopId] = useState<string | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingTicket, setAddingTicket] = useState(false);

  useEffect(() => {
    fetchRouteData();
    fetchPassengers();
    const interval = setInterval(fetchPassengers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRouteData = async () => {
    try {
      const data = await api.get<RouteData>(`/routes/${routeId}`);
      setRouteData(data);
      setStops(data.stops || []);
      if (data.stops?.length > 0) {
        setStartStopId(data.stops[0].id);
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch route stops.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async () => {
    try {
      const data = await api.get<{ currentPassengers: number }>(`/tickets/trip/${tripId}/passengers`);
      setCurrentPassengers(data.currentPassengers);
    } catch (error) {
      console.log("Fetch passenger error");
    }
  };

  const handleIssueTicket = async () => {
    if (!startStopId || !endStopId) {
      Alert.alert("Missing Fields", "Please select 'From' and 'To' stops.");
      return;
    }
    
    // Check sequence validity
    const startObj = stops.find(s => s.id === startStopId);
    const endObj = stops.find(s => s.id === endStopId);
    
    // Assuming bus only travels ascending for now, or just validate they are different
    if (startStopId === endStopId) {
      Alert.alert("Invalid Selection", "Start and End stops cannot be the same.");
      return;
    }

    setAddingTicket(true);
    try {
      await api.post('/tickets', {
        tripId,
        passengerCount,
        startStopId,
        endStopId,
        // Price is dynamically handled backend-side based on route logic
      });

      Alert.alert("Success", "Ticket issued successfully!");
      setPassengerCount(1);
      setEndStopId(null);
      fetchPassengers(); // Immediately refresh counts
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to issue ticket");
    } finally {
      setAddingTicket(false);
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
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 p-4 pt-10 bg-blue-600">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Route {routeData?.routeNumber}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Passenger Board */}
        <View className="mb-6 flex-row items-center justify-between rounded-xl bg-blue-50 p-4 shadow-sm">
          <View>
            <Text className="text-sm font-medium text-blue-900">Current Passengers</Text>
            <Text className="text-4xl font-extrabold tracking-tight text-blue-700">{currentPassengers}</Text>
          </View>
          <View className="items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <Ionicons name="people" size={32} color="#1d4ed8" />
          </View>
        </View>

        {/* Ticket Issuance Form */}
        <View className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-gray-800">Issue Ticket</Text>

          {/* From Stop */}
          <Text className="mb-1 text-sm font-medium text-gray-600">From Stop</Text>
          <View className="mb-4 rounded-lg bg-gray-50 p-1 border border-gray-200 max-h-40">
            <ScrollView nestedScrollEnabled className="max-h-32">
              {stops.map(stop => (
                <TouchableOpacity
                  key={`from-${stop.id}`}
                  className={`p-3 rounded mb-1 ${startStopId === stop.id ? "bg-blue-100" : ""}`}
                  onPress={() => setStartStopId(stop.id)}
                >
                  <Text className={`text-base ${startStopId === stop.id ? "font-bold text-blue-700" : "text-gray-700"}`}>
                    {stop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* To Stop */}
          <Text className="mb-1 text-sm font-medium text-gray-600">To Stop</Text>
          <View className="mb-6 rounded-lg bg-gray-50 p-1 border border-gray-200 max-h-40">
            <ScrollView nestedScrollEnabled className="max-h-32">
              {stops.map(stop => (
                <TouchableOpacity
                  key={`to-${stop.id}`}
                  className={`p-3 rounded mb-1 ${endStopId === stop.id ? "bg-blue-100" : ""}`}
                  onPress={() => setEndStopId(stop.id)}
                >
                  <Text className={`text-base ${endStopId === stop.id ? "font-bold text-blue-700" : "text-gray-700"}`}>
                    {stop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-base font-medium text-gray-700">Passenger Count</Text>
            <View className="flex-row items-center space-x-4 border border-gray-200 bg-gray-50 rounded-lg">
              <TouchableOpacity onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))} className="px-4 py-2">
                <Text className="text-xl font-bold text-gray-600">-</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900 w-6 text-center">{passengerCount}</Text>
              <TouchableOpacity onPress={() => setPassengerCount(passengerCount + 1)} className="px-4 py-2">
                <Text className="text-xl font-bold text-gray-600">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 flex-row justify-center items-center ${addingTicket ? "bg-gray-400" : "bg-green-600"}`}
            onPress={handleIssueTicket}
            disabled={addingTicket}
          >
            {addingTicket ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="print" size={24} color="white" className="mr-2" />
                <Text className="text-lg font-bold text-white ml-2">Print & Issue</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
