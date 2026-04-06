import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { getTrackingSocket } from "./socket";
import { SOCKET_EVENTS } from "@bus/shared";

const BACKGROUND_LOCATION_TASK = "background-location-task";

// Must be defined at module top-level (Expo requirement)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[BG Location] Error:", error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const socket = getTrackingSocket();
  const tripId = (globalThis as any).__activeTripId;

  if (!tripId || !socket.connected) return;

  for (const location of locations) {
    socket.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
      tripId,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed,
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    });
  }
});

export async function startBackgroundLocation(tripId: string) {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    throw new Error("Foreground location permission not granted");
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    throw new Error("Background location permission not granted");
  }

  (globalThis as any).__activeTripId = tripId;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10,
    foregroundService: {
      notificationTitle: "Bus Tracker",
      notificationBody: "Tracking your location for active trip",
      notificationColor: "#1d4ed8",
    },
    showsBackgroundLocationIndicator: true,
  });
}

export async function stopBackgroundLocation() {
  (globalThis as any).__activeTripId = null;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
