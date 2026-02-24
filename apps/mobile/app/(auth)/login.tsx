import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/magic-link", { email });
      router.push({ pathname: "/(auth)/verify", params: { email } });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900">Bus Tracker</Text>
        <Text className="mt-1 text-gray-500">Driver Login</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            className="rounded-lg border border-gray-300 px-4 py-3 text-base"
            placeholder="driver@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-600 py-3"
          onPress={handleMagicLink}
          disabled={loading}
        >
          <Text className="text-center text-base font-semibold text-white">
            {loading ? "Sending..." : "Send Magic Link"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.back()} className="mt-6">
        <Text className="text-center text-blue-600">Back to Map</Text>
      </TouchableOpacity>
    </View>
  );
}
