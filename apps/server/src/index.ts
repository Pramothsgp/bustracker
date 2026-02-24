import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./env.js";
import { redis } from "./lib/redis.js";
import { createSocketServer } from "./lib/socket.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import busRoutes from "./routes/bus.routes.js";
import routeRoutes from "./routes/route.routes.js";
import stopRoutes from "./routes/stop.routes.js";
import userRoutes from "./routes/user.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import { createDemoRouter } from "./routes/demo.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
app.use(express.json());

// Socket.IO
const io = createSocketServer(httpServer);

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/buses", busRoutes);
app.use("/api/v1/routes", routeRoutes);
app.use("/api/v1/stops", stopRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/trips", tripRoutes);
app.use("/api/v1/tracking", trackingRoutes);
app.use("/api/v1/demo", createDemoRouter(io));
app.use("/api/v1/health", healthRoutes);

// Connect Redis and start server
async function start() {
  try {
    await redis.connect();
  } catch (err) {
    console.warn("Redis connection failed, continuing without real-time features:", (err as Error).message);
  }

  httpServer.listen(env.PORT, () => {
    console.log(`🚌 Bus Tracker API running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   CORS: ${env.CORS_ORIGIN}`);
  });
}

start();
