import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { RouteService } from "../services/route.service.js";
import { TrackingService } from "../services/tracking.service.js";
import { RouteSearchSchema } from "@bus/shared";

const router = Router();

router.get("/", effectHandler(() => RouteService.list()));

router.get(
  "/search",
  validate(RouteSearchSchema, "query"),
  effectHandler((req) => RouteService.search(req.query.q as string))
);

router.get("/:id", effectHandler((req) => RouteService.getById(req.params.id as string)));

router.get(
  "/:id/buses",
  effectHandler((req) => TrackingService.getRouteActiveBuses(req.params.id as string))
);

export default router;
