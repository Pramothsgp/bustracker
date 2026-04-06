import { createEmailClient } from "@bus/email";
import { env } from "../env.js";

export const emailClient = createEmailClient(
  env.NODE_ENV === "production" &&
    env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.SMTP_FROM_EMAIL
    ? {
        provider: "smtp",
        smtp: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
          from: env.SMTP_FROM_EMAIL,
        },
      }
    : { provider: "console" },
);
