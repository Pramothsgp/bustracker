import { Effect } from "effect";
import { eq, and, isNotNull } from "drizzle-orm";
import { stops, routeStops, routes } from "@bus/db";
import { db } from "../lib/db.js";
import { haversineDistance } from "../lib/haversine.js";

export class StopService {
  static list() {
    return Effect.tryPromise({
      try: () => db.select().from(stops),
      catch: (e) => new Error(String(e)),
    });
  }

  static getById(id: string) {
    return Effect.tryPromise({
      try: async () => {
        const [stop] = await db.select().from(stops).where(eq(stops.id, id));
        if (!stop) throw new Error("Not found: Stop not found");

        // Get routes that pass through this stop
        const stopRoutes = await db
          .select({
            routeId: routeStops.routeId,
            sequence: routeStops.sequence,
            routeNumber: routes.routeNumber,
            routeName: routes.routeName,
          })
          .from(routeStops)
          .innerJoin(routes, eq(routeStops.routeId, routes.id))
          .where(eq(routeStops.stopId, id));

        return {
          ...stop,
          routes: stopRoutes,
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static nearby(lat: number, lng: number, radiusKm: number) {
    return Effect.tryPromise({
      try: async () => {
        // Get all geocoded stops
        const allStops = await db
          .select()
          .from(stops)
          .where(and(isNotNull(stops.lat), isNotNull(stops.lng)));

        // Filter by haversine distance
        return allStops
          .filter((stop) => {
            const dist = haversineDistance(lat, lng, stop.lat!, stop.lng!);
            return dist <= radiusKm;
          })
          .map((stop) => ({
            ...stop,
            distance: haversineDistance(lat, lng, stop.lat!, stop.lng!),
          }))
          .sort((a, b) => a.distance - b.distance);
      },
      catch: (e) => new Error(String(e)),
    });
  }
}
