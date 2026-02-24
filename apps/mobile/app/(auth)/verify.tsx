import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleVerify = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: any }>("/auth/verify", { token });
      await login(data.token, data.user);
      router.replace("/(driver)/dashboard");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900">Verify</Text>
        <Text className="mt-1 text-gray-500">
          Enter the token sent to {email}
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="mb-1 text-sm font-medium text-gray-700">Token</Text>
          <TextInput
            className="rounded-lg border border-gray-300 px-4 py-3 text-base"
            placeholder="Paste your token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-600 py-3"
          onPress={handleVerify}
          disabled={loading}
        >
          <Text className="text-center text-base font-semibold text-white">
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
