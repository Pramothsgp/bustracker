import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function BusDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [passengerInfo, setPassengerInfo] = useState<{ currentPassengers: number, remainingSeats: number, capacity: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await api.get<{ currentPassengers: number, remainingSeats: number, capacity: number }>(`/tickets/bus/${id}/passengers`);
        setPassengerInfo({
          currentPassengers: data.currentPassengers,
          remainingSeats: data.remainingSeats,
          capacity: data.capacity,
        });
      } catch (err) {
        console.error("Failed to fetch passenger info", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfo();
    const interval = setInterval(fetchInfo, 10000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Bus Tracker Dashboard</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" />
      ) : passengerInfo ? (
        <View className="flex-col gap-4">
          <View className="bg-blue-50 p-6 rounded-2xl">
            <Text className="text-blue-900 text-lg font-medium mb-1">Current Passengers</Text>
            <Text className="text-blue-700 text-5xl font-bold">{passengerInfo.currentPassengers}</Text>
          </View>

          <View className="flex-row gap-4">
            <View className="bg-green-50 p-6 rounded-2xl flex-1">
              <Text className="text-green-900 text-lg font-medium mb-1">Remaining</Text>
              <Text className="text-green-700 text-4xl font-bold">{passengerInfo.remainingSeats}</Text>
            </View>

            <View className="bg-gray-50 p-6 rounded-2xl flex-1">
              <Text className="text-gray-900 text-lg font-medium mb-1">Capacity</Text>
              <Text className="text-gray-700 text-4xl font-bold">{passengerInfo.capacity}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-gray-50 p-6 rounded-2xl">
          <Text className="text-gray-500 text-center">No active trip found for this bus or passenger information is unavailable.</Text>
        </View>
      )}
    </View>
  );
}
