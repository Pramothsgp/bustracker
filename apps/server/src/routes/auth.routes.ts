import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { AuthService } from "../services/auth.service.js";
import { MagicLinkRequestSchema, MagicLinkVerifySchema, AdminLoginSchema } from "@bus/shared";

const router = Router();

router.post(
  "/magic-link",
  validate(MagicLinkRequestSchema),
  effectHandler((req) => AuthService.requestMagicLink(req.body.email))
);

router.post(
  "/verify",
  validate(MagicLinkVerifySchema),
  effectHandler((req) => AuthService.verifyMagicLink(req.body.token))
);

router.post(
  "/admin/login",
  validate(AdminLoginSchema),
  effectHandler((req) => AuthService.adminLogin(req.body.email, req.body.password))
);

router.get(
  "/me",
  authenticate,
  effectHandler((req) => AuthService.getMe(req.user!.userId))
);

export default router;
