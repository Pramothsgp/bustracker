import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { StopService } from "../services/stop.service.js";
import { NearbyStopsSchema } from "@bus/shared";

const router = Router();

router.get("/", effectHandler(() => StopService.list()));

router.get(
  "/nearby",
  validate(NearbyStopsSchema, "query"),
  effectHandler((req) => {
    const { lat, lng, radius } = req.query as any;
    return StopService.nearby(Number(lat), Number(lng), Number(radius));
  })
);

router.get("/:id", effectHandler((req) => StopService.getById(req.params.id as string)));

export default router;
