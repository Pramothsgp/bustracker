import { Effect } from "effect";
import { eq, ilike, or } from "drizzle-orm";
import { routes, routeStops, stops } from "@bus/db";
import { db } from "../lib/db.js";

export class RouteService {
  static list() {
    return Effect.tryPromise({
      try: () => db.select().from(routes),
      catch: (e) => new Error(String(e)),
    });
  }

  static getById(id: string) {
    return Effect.tryPromise({
      try: async () => {
        const [route] = await db.select().from(routes).where(eq(routes.id, id));
        if (!route) throw new Error("Not found: Route not found");

        // Get stops for this route, ordered by sequence
        const routeStopRows = await db
          .select({
            stopId: routeStops.stopId,
            sequence: routeStops.sequence,
            name: stops.name,
            nameTa: stops.nameTa,
            lat: stops.lat,
            lng: stops.lng,
          })
          .from(routeStops)
          .innerJoin(stops, eq(routeStops.stopId, stops.id))
          .where(eq(routeStops.routeId, id))
          .orderBy(routeStops.sequence);

        return {
          ...route,
          stops: routeStopRows.map((rs) => ({
            id: rs.stopId,
            name: rs.name,
            nameTa: rs.nameTa,
            lat: rs.lat,
            lng: rs.lng,
            sequence: rs.sequence,
          })),
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static search(query: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(routes)
          .where(
            or(
              ilike(routes.routeNumber, `%${query}%`),
              ilike(routes.routeName, `%${query}%`),
              ilike(routes.origin, `%${query}%`),
              ilike(routes.destination, `%${query}%`)
            )
          ),
      catch: (e) => new Error(String(e)),
    });
  }
}
