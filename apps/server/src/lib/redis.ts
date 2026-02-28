import Redis from "ioredis";
import { env } from "../env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  commandTimeout: 3000,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying
    return Math.min(times * 500, 2000);
  },
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});
