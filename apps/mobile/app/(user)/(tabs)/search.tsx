import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/lib/api";

interface RouteResult {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<RouteResult[]>(`/routes/search?q=${encodeURIComponent(text)}`);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center rounded-lg bg-gray-100 px-3 py-2">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="ml-2 flex-1 text-base"
            placeholder="Search routes, stops..."
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mb-2 rounded-lg border border-gray-200 p-3"
            onPress={() => router.push(`/(user)/route/${item.id}`)}
          >
            <View className="flex-row items-center">
              <View className="mr-3 rounded-md bg-blue-100 px-2 py-1">
                <Text className="font-bold text-blue-700">{item.routeNumber}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                  {item.origin} → {item.destination}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text className="mt-8 text-center text-gray-400">No routes found</Text>
          ) : null
        }
      />
    </View>
  );
}
