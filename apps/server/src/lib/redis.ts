import Redis from "ioredis";
import { env } from "../env.js";

export const redis = new Redis(env.REDIS_URL, {
  // Keep retrying in long-running server processes; don't permanently close after brief outages.
  maxRetriesPerRequest: null,
  connectTimeout: 5000,
  commandTimeout: 3000,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 500, 5000);
  },
  reconnectOnError: () => true,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});
