import { createEmailClient } from "@bus/email";
import { env } from "../env.js";

export const emailClient = createEmailClient(
  env.NODE_ENV === "production" && env.RESEND_API_KEY && env.RESEND_FROM_EMAIL
    ? {
        provider: "resend",
        resend: {
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
        },
      }
    : { provider: "console" },
);
