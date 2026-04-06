import Redis from "ioredis";
import { env } from "../env.js";

type GeoPoint = { lng: number; lat: number };

class InMemoryRedis {
  private hashes = new Map<string, Record<string, string>>();
  private sets = new Map<string, Set<string>>();
  private geo = new Map<string, Map<string, GeoPoint>>();

  on(_event: string, _handler: (..._args: unknown[]) => void) {}

  async connect() {
    return "OK";
  }

  async ping() {
    return "PONG";
  }

  async geoadd(key: string, lng: number, lat: number, member: string) {
    const bucket = this.geo.get(key) ?? new Map<string, GeoPoint>();
    bucket.set(member, { lng, lat });
    this.geo.set(key, bucket);
    return 1;
  }

  async georadius(
    key: string,
    lng: number,
    lat: number,
    radius: number,
    unit: "km",
    _withCoord: "WITHCOORD",
    _withDist: "WITHDIST",
    _order: "ASC"
  ) {
    const bucket = this.geo.get(key) ?? new Map<string, GeoPoint>();
    const maxKm = unit === "km" ? radius : radius;
    const rows: [string, string, [string, string]][] = [];
    for (const [member, point] of bucket.entries()) {
      const d = haversineKm(lat, lng, point.lat, point.lng);
      if (d <= maxKm) rows.push([member, d.toString(), [point.lng.toString(), point.lat.toString()]]);
    }
    rows.sort((a, b) => Number(a[1]) - Number(b[1]));
    return rows;
  }

  async hset(key: string, value: Record<string, string>) {
    const existing = this.hashes.get(key) ?? {};
    this.hashes.set(key, { ...existing, ...value });
    return 1;
  }

  async hgetall(key: string) {
    return this.hashes.get(key) ?? {};
  }

  async expire(_key: string, _seconds: number) {
    return 1;
  }

  async zrange(key: string, _start: number, _stop: number) {
    const bucket = this.geo.get(key) ?? new Map<string, GeoPoint>();
    return Array.from(bucket.keys());
  }

  async zrem(key: string, member: string) {
    const bucket = this.geo.get(key);
    if (!bucket) return 0;
    return bucket.delete(member) ? 1 : 0;
  }

  async sadd(key: string, member: string) {
    const bucket = this.sets.get(key) ?? new Set<string>();
    const before = bucket.size;
    bucket.add(member);
    this.sets.set(key, bucket);
    return bucket.size > before ? 1 : 0;
  }

  async srem(key: string, member: string) {
    const bucket = this.sets.get(key);
    if (!bucket) return 0;
    return bucket.delete(member) ? 1 : 0;
  }

  async smembers(key: string) {
    return Array.from(this.sets.get(key) ?? []);
  }

  async del(key: string) {
    const a = this.hashes.delete(key);
    const b = this.sets.delete(key);
    const c = this.geo.delete(key);
    return a || b || c ? 1 : 0;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const realRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 5000,
  commandTimeout: 10000,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 500, 5000);
  },
  reconnectOnError: () => true,
});

realRedis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

realRedis.on("connect", () => {
  console.log("Redis connected");
});

const memoryRedis = new InMemoryRedis();

export const redis = env.REDIS_DISABLED ? memoryRedis : realRedis;

if (env.REDIS_DISABLED) {
  console.warn("REDIS_DISABLED=true: using in-memory redis fallback");
}
