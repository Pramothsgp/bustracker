import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function BusDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg text-gray-500">Bus Detail: {id}</Text>
    </View>
  );
}
