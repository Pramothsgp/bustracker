import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { TrackingService } from "../services/tracking.service.js";
import { NearbyBusesSchema } from "@bus/shared";

const router = Router();

router.get("/buses", effectHandler(() => TrackingService.getActiveBuses()));

router.get(
  "/buses/nearby",
  validate(NearbyBusesSchema, "query"),
  effectHandler((req) => {
    const { lat, lng, radius } = req.query as any;
    return TrackingService.getNearbyBuses(Number(lat), Number(lng), Number(radius));
  })
);

router.get(
  "/route/:routeId",
  effectHandler((req) => TrackingService.getRouteActiveBuses(req.params.routeId))
);

export default router;
