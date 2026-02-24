import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { Effect } from "effect";
import { verifyToken } from "./jwt.js";
import { TrackingService } from "../services/tracking.service.js";
import { tripLocations, trips, buses, routes } from "@bus/db";
import { db } from "./db.js";
import { eq, and } from "drizzle-orm";
import { SOCKET_EVENTS } from "@bus/shared";
import type { LocationUpdatePayload, NearbySubscribePayload } from "@bus/shared";
import { env } from "../env.js";

// Buffer for batched location inserts
const locationBuffer: {
  tripId: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recordedAt: Date;
}[] = [];

let flushInterval: NodeJS.Timeout | null = null;

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(","),
      methods: ["GET", "POST"],
    },
  });

  // Tracking namespace
  const tracking = io.of("/tracking");

  tracking.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Track a specific route
    socket.on(SOCKET_EVENTS.TRACK_ROUTE, (routeId: string) => {
      socket.join(`route:${routeId}`);
    });

    socket.on(SOCKET_EVENTS.UNTRACK_ROUTE, (routeId: string) => {
      socket.leave(`route:${routeId}`);
    });

    // Track a specific bus/trip
    socket.on(SOCKET_EVENTS.TRACK_BUS, (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on(SOCKET_EVENTS.UNTRACK_BUS, (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    // Subscribe to nearby updates
    socket.on(SOCKET_EVENTS.NEARBY_SUBSCRIBE, (data: NearbySubscribePayload) => {
      socket.data.nearbyLat = data.lat;
      socket.data.nearbyLng = data.lng;
      socket.data.nearbyRadius = data.radiusKm;
      socket.join("nearby:subscribers");
    });

    socket.on(SOCKET_EVENTS.NEARBY_UNSUBSCRIBE, () => {
      socket.leave("nearby:subscribers");
    });

    // Driver sends location update
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, async (data: LocationUpdatePayload) => {
      try {
        // Get trip details to find route
        const [trip] = await db
          .select({
            routeId: trips.routeId,
            busId: trips.busId,
          })
          .from(trips)
          .where(and(eq(trips.id, data.tripId), eq(trips.status, "active")));

        if (!trip) return;

        const [route] = await db
          .select({ routeNumber: routes.routeNumber })
          .from(routes)
          .where(eq(routes.id, trip.routeId));

        // Update Redis
        await Effect.runPromise(
          TrackingService.updateLocation(data.tripId, {
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            heading: data.heading,
            busId: trip.busId,
            routeId: trip.routeId,
            routeNumber: route?.routeNumber || "",
          })
        );

        // Broadcast to route subscribers
        const payload = {
          tripId: data.tripId,
          busId: trip.busId,
          routeId: trip.routeId,
          routeNumber: route?.routeNumber || "",
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
        };

        tracking.to(`route:${trip.routeId}`).emit(SOCKET_EVENTS.BUS_MOVED, payload);
        tracking.to(`trip:${data.tripId}`).emit(SOCKET_EVENTS.BUS_POSITION, payload);
        tracking.emit(SOCKET_EVENTS.BUS_MOVED, payload);

        // Buffer for DB insert
        locationBuffer.push({
          tripId: data.tripId,
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
          recordedAt: new Date(data.timestamp),
        });
      } catch (err) {
        console.error("[Socket] Location update error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Flush location buffer periodically
  flushInterval = setInterval(async () => {
    if (locationBuffer.length === 0) return;
    const batch = locationBuffer.splice(0, locationBuffer.length);
    try {
      await db.insert(tripLocations).values(
        batch.map((loc) => ({
          ...loc,
        }))
      );
    } catch (err) {
      console.error("[Socket] Batch insert error:", err);
    }
  }, 30_000); // Flush every 30 seconds

  return io;
}
