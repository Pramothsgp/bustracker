import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { BusService } from "../services/bus.service.js";
import { CreateBusSchema, UpdateBusSchema } from "@bus/shared";

const router = Router();

router.get("/", effectHandler(() => BusService.list()));

router.get("/:id", effectHandler((req) => BusService.getById(req.params.id as string)));

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(CreateBusSchema),
  effectHandler((req) => BusService.create(req.body))
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(UpdateBusSchema),
  effectHandler((req) => BusService.update(req.params.id as string, req.body))
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  effectHandler((req) => BusService.delete(req.params.id as string))
);

export default router;
