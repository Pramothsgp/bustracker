import { Effect } from "effect";
import { redis } from "../lib/redis.js";
import { REDIS_BUS_TTL_SECONDS } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

export class TrackingService {
  private static isRedisReadError(error: unknown): boolean {
    const message = String(error).toLowerCase();
    return (
      message.includes("connect") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("wrongtype") ||
      message.includes("clusterdown")
    );
  }

  private static toActiveBusPosition(tripId: string, data: Record<string, string>): ActiveBusPosition | null {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    const timestamp = Number(data.timestamp);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(timestamp)) {
      return null;
    }

    return {
      tripId,
      busId: data.busId,
      routeId: data.routeId,
      routeNumber: data.routeNumber,
      lat,
      lng,
      speed: data.speed ? Number(data.speed) : null,
      heading: data.heading ? Number(data.heading) : null,
      timestamp,
    };
  }

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
        let members: string[] = [];
        try {
          members = await redis.zrange("active_buses", 0, -1);
        } catch (error) {
          if (this.isRedisReadError(error)) {
            console.warn("TrackingService.getActiveBuses: redis unavailable, returning empty list");
            return [];
          }
          throw error;
        }

        const buses: ActiveBusPosition[] = [];

        for (const tripId of members) {
          const data = await redis.hgetall(`bus:${tripId}`).catch(() => null);
          if (data && data.lat) {
            const bus = this.toActiveBusPosition(tripId, data);
            if (bus) buses.push(bus);
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
        const results = await redis
          .georadius("active_buses", lng, lat, radiusKm, "km", "WITHCOORD", "WITHDIST", "ASC")
          .catch((error) => {
            if (this.isRedisReadError(error)) return [] as any[];
            throw error;
          });

        const buses: (ActiveBusPosition & { distance: number })[] = [];

        for (const result of results as any[]) {
          const tripId = result[0] as string;
          const distance = parseFloat(result[1] as string);
          const data = await redis.hgetall(`bus:${tripId}`).catch(() => null);
          if (data && data.lat) {
            const bus = this.toActiveBusPosition(tripId, data);
            if (bus) buses.push({ ...bus, distance });
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
        const tripIds = await redis.smembers(`route:${routeId}:trips`).catch((error) => {
          if (this.isRedisReadError(error)) return [] as string[];
          throw error;
        });
        const buses: ActiveBusPosition[] = [];

        for (const tripId of tripIds) {
          const data = await redis.hgetall(`bus:${tripId}`).catch(() => null);
          if (data && data.lat) {
            const bus = this.toActiveBusPosition(tripId, data);
            if (bus) buses.push(bus);
          }
        }

        return buses;
      },
      catch: (e) => new Error(String(e)),
    });
  }
}
