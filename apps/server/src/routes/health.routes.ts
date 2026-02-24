import { Router } from "express";
import { redis } from "../lib/redis.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/ready", async (_req, res) => {
  try {
    await redis.ping();
    res.json({ status: "ready", redis: "connected" });
  } catch {
    res.status(503).json({ status: "not ready", redis: "disconnected" });
  }
});

export default router;
