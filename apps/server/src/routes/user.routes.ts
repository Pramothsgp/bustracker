import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { UserService } from "../services/user.service.js";
import { CreateUserSchema, UpdateUserSchema } from "@bus/shared";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("admin"),
  effectHandler(() => UserService.list())
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(CreateUserSchema),
  effectHandler((req) => UserService.create(req.body))
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(UpdateUserSchema),
  effectHandler((req) => UserService.update(req.params.id as string, req.body))
);

export default router;
