import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { DemoService } from "../services/demo.service.js";
import type { Server } from "socket.io";

export function createDemoRouter(io: Server) {
  const router = Router();

  router.post(
    "/start",
    authenticate,
    authorize("admin"),
    effectHandler((req) => DemoService.start(io, req.body.routeIds))
  );

  router.post(
    "/stop",
    authenticate,
    authorize("admin"),
    effectHandler(() => DemoService.stop())
  );

  router.get("/status", effectHandler(() => DemoService.status()));

  return router;
}
