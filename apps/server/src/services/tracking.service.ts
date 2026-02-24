import { Effect } from "effect";
import { redis } from "../lib/redis.js";
import { REDIS_BUS_TTL_SECONDS } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

export class TrackingService {
  static updateLocation(
    tripId: string,
    data: {
      lat: number;
      lng: number;
      speed: number | null;
      heading: number | null;
      busId: string;
      routeId: string;
      routeNumber: string;
    }
  ) {
    return Effect.tryPromise({
      try: async () => {
        const timestamp = Date.now();

        // Update geo index
        await redis.geoadd("active_buses", data.lng, data.lat, tripId);

        // Update bus metadata hash
        await redis.hset(`bus:${tripId}`, {
          lat: String(data.lat),
          lng: String(data.lng),
          speed: String(data.speed ?? ""),
          heading: String(data.heading ?? ""),
          timestamp: String(timestamp),
          routeId: data.routeId,
          busId: data.busId,
          routeNumber: data.routeNumber,
        });
        await redis.expire(`bus:${tripId}`, REDIS_BUS_TTL_SECONDS);

        return { tripId, lat: data.lat, lng: data.lng, timestamp };
      },
      catch: (e) => new Error(String(e)),
    });
  }

  static getActiveBuses() {
    return Effect.tryPromise({
      try: async () => {
        const members = await redis.zrange("active_buses", 0, -1);
        const buses: ActiveBusPosition[] = [];

        for (const tripId of members) {
          const data = await redis.hgetall(`bus:${tripId}`);
          if (data && data.lat) {
            buses.push({
              tripId,
              busId: data.busId,
              routeId: data.routeId,
              routeNumber: data.routeNumber,
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              speed: data.speed ? parseFloat(data.speed) : null,
              heading: data.heading ? parseFloat(data.heading) : null,
              timestamp: parseInt(data.timestamp, 10),
            });
          }
        }

        return buses;
      },
      catch: (e) => new Error(String(e)),
    });
  }

  static getNearbyBuses(lat: number, lng: number, radiusKm: number) {
    return Effect.tryPromise({
      try: async () => {
        const results = await redis.georadius(
          "active_buses",
          lng,
          lat,
          radiusKm,
          "km",
          "WITHCOORD",
          "WITHDIST",
          "ASC"
        );

        const buses: (ActiveBusPosition & { distance: number })[] = [];

        for (const result of results as any[]) {
          const tripId = result[0] as string;
          const distance = parseFloat(result[1] as string);
          const data = await redis.hgetall(`bus:${tripId}`);
          if (data && data.lat) {
            buses.push({
              tripId,
              busId: data.busId,
              routeId: data.routeId,
              routeNumber: data.routeNumber,
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              speed: data.speed ? parseFloat(data.speed) : null,
              heading: data.heading ? parseFloat(data.heading) : null,
              timestamp: parseInt(data.timestamp, 10),
              distance,
            });
          }
        }

        return buses;
      },
      catch: (e) => new Error(String(e)),
    });
  }

  static getRouteActiveBuses(routeId: string) {
    return Effect.tryPromise({
      try: async () => {
        const tripIds = await redis.smembers(`route:${routeId}:trips`);
        const buses: ActiveBusPosition[] = [];

        for (const tripId of tripIds) {
          const data = await redis.hgetall(`bus:${tripId}`);
          if (data && data.lat) {
            buses.push({
              tripId,
              busId: data.busId,
              routeId: data.routeId,
              routeNumber: data.routeNumber,
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              speed: data.speed ? parseFloat(data.speed) : null,
              heading: data.heading ? parseFloat(data.heading) : null,
              timestamp: parseInt(data.timestamp, 10),
            });
          }
        }

        return buses;
      },
      catch: (e) => new Error(String(e)),
    });
  }
}
