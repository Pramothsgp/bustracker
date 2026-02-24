import { Effect } from "effect";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { trips, buses, routes, users } from "@bus/db";
import { db } from "../lib/db.js";
import { redis } from "../lib/redis.js";
import type { StartTripInput } from "@bus/shared";
import { REDIS_BUS_TTL_SECONDS } from "@bus/shared";

export class TripService {
  static list() {
    return Effect.tryPromise({
      try: () =>
        db
          .select({
            id: trips.id,
            busId: trips.busId,
            routeId: trips.routeId,
            driverId: trips.driverId,
            conductorId: trips.conductorId,
            status: trips.status,
            startedAt: trips.startedAt,
            endedAt: trips.endedAt,
            createdAt: trips.createdAt,
          })
          .from(trips),
      catch: (e) => new Error(String(e)),
    });
  }

  static start(driverId: string, input: StartTripInput) {
    return Effect.tryPromise({
      try: async () => {
        // Verify bus exists and is active
        const [bus] = await db
          .select()
          .from(buses)
          .where(and(eq(buses.id, input.busId), eq(buses.status, "active")));
        if (!bus) throw new Error("Not found: Bus not found or not active");

        // Verify route exists
        const [route] = await db
          .select()
          .from(routes)
          .where(eq(routes.id, input.routeId));
        if (!route) throw new Error("Not found: Route not found");

        // Check no active trip for this bus
        const [activeTrip] = await db
          .select()
          .from(trips)
          .where(and(eq(trips.busId, input.busId), eq(trips.status, "active")));
        if (activeTrip) throw new Error("Conflict: Bus already has an active trip");

        // Create trip
        const [trip] = await db
          .insert(trips)
          .values({
            id: createId(),
            busId: input.busId,
            routeId: input.routeId,
            driverId,
            conductorId: input.conductorId || null,
            status: "active",
            startedAt: new Date(),
          })
          .returning();

        // Register in Redis
        await redis.sadd(`route:${input.routeId}:trips`, trip.id);

        return { ...trip, routeNumber: route.routeNumber, busRegistration: bus.registrationNumber };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static end(tripId: string, driverId: string) {
    return Effect.tryPromise({
      try: async () => {
        const [trip] = await db
          .select()
          .from(trips)
          .where(and(eq(trips.id, tripId), eq(trips.driverId, driverId), eq(trips.status, "active")));

        if (!trip) throw new Error("Not found: Active trip not found");

        const [updated] = await db
          .update(trips)
          .set({ status: "completed", endedAt: new Date() })
          .where(eq(trips.id, tripId))
          .returning();

        // Clean up Redis
        await redis.srem(`route:${trip.routeId}:trips`, tripId);
        await redis.del(`bus:${tripId}`);
        await redis.zrem("active_buses", tripId);

        return updated;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }
}
