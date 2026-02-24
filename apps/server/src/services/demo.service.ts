import { Effect } from "effect";
import { eq, and, isNotNull } from "drizzle-orm";
import { routes, routeStops, stops } from "@bus/db";
import { db } from "../lib/db.js";
import { redis } from "../lib/redis.js";
import { TrackingService } from "./tracking.service.js";
import { DEMO_SPEED_KMH, DEMO_TICK_MS, REDIS_BUS_TTL_SECONDS } from "@bus/shared";
import { haversineDistance } from "../lib/haversine.js";
import type { Server } from "socket.io";

interface DemoBus {
  tripId: string;
  routeId: string;
  routeNumber: string;
  busId: string;
  stops: { lat: number; lng: number; name: string }[];
  currentStopIdx: number;
  progress: number; // 0-1 between current and next stop
}

let demoIntervals: NodeJS.Timeout[] = [];
let demoBuses: DemoBus[] = [];
let demoRunning = false;

export class DemoService {
  static start(io: Server, routeIds?: string[]) {
    return Effect.tryPromise({
      try: async () => {
        if (demoRunning) throw new Error("Conflict: Demo already running");

        // Get routes with geocoded stops
        let routeList;
        if (routeIds && routeIds.length > 0) {
          routeList = await db.select().from(routes);
          routeList = routeList.filter((r) => routeIds.includes(r.id));
        } else {
          routeList = await db.select().from(routes).limit(10);
        }

        demoBuses = [];

        for (const route of routeList) {
          const routeStopRows = await db
            .select({
              lat: stops.lat,
              lng: stops.lng,
              name: stops.name,
              sequence: routeStops.sequence,
            })
            .from(routeStops)
            .innerJoin(stops, eq(routeStops.stopId, stops.id))
            .where(
              and(
                eq(routeStops.routeId, route.id),
                isNotNull(stops.lat),
                isNotNull(stops.lng)
              )
            )
            .orderBy(routeStops.sequence);

          if (routeStopRows.length < 2) continue;

          const demoBus: DemoBus = {
            tripId: `demo-${route.routeNumber}-${Date.now()}`,
            routeId: route.id,
            routeNumber: route.routeNumber,
            busId: `demo-bus-${route.routeNumber}`,
            stops: routeStopRows.map((s) => ({
              lat: s.lat!,
              lng: s.lng!,
              name: s.name,
            })),
            currentStopIdx: 0,
            progress: 0,
          };

          demoBuses.push(demoBus);

          // Register in Redis
          await redis.sadd(`route:${route.id}:trips`, demoBus.tripId);
        }

        // Start simulation ticks
        const interval = setInterval(() => {
          simulateTick(io);
        }, DEMO_TICK_MS);
        demoIntervals.push(interval);

        // Initial positions
        await simulateTick(io);

        demoRunning = true;
        return {
          message: `Demo started with ${demoBuses.length} virtual buses`,
          busCount: demoBuses.length,
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static stop() {
    return Effect.tryPromise({
      try: async () => {
        for (const interval of demoIntervals) {
          clearInterval(interval);
        }
        demoIntervals = [];

        // Clean up Redis
        for (const bus of demoBuses) {
          await redis.srem(`route:${bus.routeId}:trips`, bus.tripId);
          await redis.del(`bus:${bus.tripId}`);
          await redis.zrem("active_buses", bus.tripId);
        }

        demoBuses = [];
        demoRunning = false;
        return { message: "Demo stopped" };
      },
      catch: (e) => new Error(String(e)),
    });
  }

  static status() {
    return Effect.succeed({
      running: demoRunning,
      busCount: demoBuses.length,
      buses: demoBuses.map((b) => ({
        tripId: b.tripId,
        routeNumber: b.routeNumber,
        currentStop: b.stops[b.currentStopIdx]?.name,
        nextStop: b.stops[b.currentStopIdx + 1]?.name,
      })),
    });
  }
}

async function simulateTick(io: Server) {
  const distancePerTick = (DEMO_SPEED_KMH / 3600) * (DEMO_TICK_MS / 1000);

  for (const bus of demoBuses) {
    if (bus.currentStopIdx >= bus.stops.length - 1) {
      // Reached end, loop back
      bus.currentStopIdx = 0;
      bus.progress = 0;
    }

    const currentStop = bus.stops[bus.currentStopIdx];
    const nextStop = bus.stops[bus.currentStopIdx + 1];
    if (!currentStop || !nextStop) continue;

    const segmentDistance = haversineDistance(
      currentStop.lat,
      currentStop.lng,
      nextStop.lat,
      nextStop.lng
    );

    if (segmentDistance > 0) {
      bus.progress += distancePerTick / segmentDistance;
    } else {
      bus.progress = 1;
    }

    if (bus.progress >= 1) {
      bus.currentStopIdx++;
      bus.progress = 0;
    }

    // Interpolate position
    const t = Math.min(bus.progress, 1);
    const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * t;
    const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * t;

    // Calculate heading
    const heading =
      (Math.atan2(nextStop.lng - currentStop.lng, nextStop.lat - currentStop.lat) * 180) /
      Math.PI;

    // Update Redis via tracking service
    await Effect.runPromise(
      TrackingService.updateLocation(bus.tripId, {
        lat,
        lng,
        speed: DEMO_SPEED_KMH,
        heading,
        busId: bus.busId,
        routeId: bus.routeId,
        routeNumber: bus.routeNumber,
      })
    );

    // Broadcast via Socket.IO
    const payload = {
      tripId: bus.tripId,
      busId: bus.busId,
      routeId: bus.routeId,
      routeNumber: bus.routeNumber,
      lat,
      lng,
      speed: DEMO_SPEED_KMH,
      heading,
      timestamp: Date.now(),
    };

    io.of("/tracking").to(`route:${bus.routeId}`).emit("bus:moved", payload);
    io.of("/tracking").to(`trip:${bus.tripId}`).emit("bus:position", payload);
    io.of("/tracking").emit("bus:moved", payload); // broadcast to all tracking subscribers
  }
}
