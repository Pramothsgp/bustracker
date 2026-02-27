import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView } from "react-native";
import { AuthProvider } from "@/lib/auth-context";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626", marginBottom: 12 }}>
            App Error
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>
              {this.state.error.message}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(user)" />
          <Stack.Screen name="(driver)" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
