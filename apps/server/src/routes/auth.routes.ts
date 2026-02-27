import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { AuthService } from "../services/auth.service.js";
import { OtpRequestSchema, OtpVerifySchema, AdminLoginSchema } from "@bus/shared";

const router = Router();

router.post(
  "/request-otp",
  validate(OtpRequestSchema),
  effectHandler((req) => AuthService.requestOtp(req.body.email))
);

router.post(
  "/verify-otp",
  validate(OtpVerifySchema),
  effectHandler((req) => AuthService.verifyOtp(req.body.email, req.body.code))
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
