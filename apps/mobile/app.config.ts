import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Coimbatore Bus Tracker",
  slug: "bus-tracker",
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:3000",
  },
});
