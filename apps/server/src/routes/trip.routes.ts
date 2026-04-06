import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { TripService } from "../services/trip.service.js";
import { StartTripSchema } from "@bus/shared";

const router = Router();

router.get("/", effectHandler(() => TripService.list()));

router.get(
  "/active",
  authenticate,
  authorize("driver", "conductor"),
  effectHandler((req) => TripService.getActiveTripForUser(req.user!.userId))
);

router.get(
  "/all-active",
  authenticate,
  authorize("conductor"),
  effectHandler(() => TripService.listActive())
);

router.post(
  "/start",
  authenticate,
  authorize("driver", "conductor"),
  validate(StartTripSchema),
  effectHandler((req) => TripService.start(req.user!.userId, req.user!.role, req.body))
);

router.post(
  "/:id/end",
  authenticate,
  authorize("driver", "conductor"),
  effectHandler((req) => TripService.end(req.params.id as string, req.user!.userId))
);

export default router;
