import { Effect } from "effect";
import { eq, and, gt, gte, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users, otpCodes } from "@bus/db";
import { db } from "../lib/db.js";
import { signToken } from "../lib/jwt.js";
import { env } from "../env.js";
import { emailClient } from "../lib/email.js";
import crypto from "crypto";

function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, "0");
}

export class AuthService {
  static adminLogin(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), eq(users.role, "admin")));

        if (!user || !user.passwordHash) {
          throw new Error("Unauthorized: Invalid credentials");
        }

        const valid = await Bun.password.verify(password, user.passwordHash);
        if (!valid) {
          throw new Error("Unauthorized: Invalid credentials");
        }

        const token = signToken({ userId: user.id, role: user.role });
        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static requestOtp(email: string) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          throw new Error("Not found: User not found");
        }

        // Rate limit: max 5 OTPs per hour per user
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentOtps = await db
          .select({ id: otpCodes.id })
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.userId, user.id),
              gte(otpCodes.createdAt, oneHourAgo),
            ),
          );

        if (recentOtps.length >= 5) {
          throw new Error(
            "Too many requests: Please wait before requesting another OTP",
          );
        }

        // Invalidate previous unused OTPs for this user
        await db
          .update(otpCodes)
          .set({ usedAt: new Date() })
          .where(and(eq(otpCodes.userId, user.id), isNull(otpCodes.usedAt)));

        const code = generateOtp();
        const expiresAt = new Date(
          Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000,
        );

        await db.insert(otpCodes).values({
          id: createId(),
          userId: user.id,
          code,
          expiresAt,
        });

        await emailClient.send({
          to: email,
          subject: "Your Bus Tracker login code",
          text: `Your verification code is: ${code}\n\nThis code expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
        });

        return { message: "OTP sent" };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static verifyOtp(email: string, code: string) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          throw new Error("Unauthorized: Invalid credentials");
        }

        const [otp] = await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.userId, user.id),
              eq(otpCodes.code, code),
              isNull(otpCodes.usedAt),
              gt(otpCodes.expiresAt, new Date()),
            ),
          );

        if (!otp) {
          throw new Error("Unauthorized: Invalid or expired OTP");
        }

        // Mark as used
        await db
          .update(otpCodes)
          .set({ usedAt: new Date() })
          .where(eq(otpCodes.id, otp.id));

        const jwt = signToken({ userId: user.id, role: user.role });
        return {
          token: jwt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static getMe(userId: string) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          throw new Error("Not found: User not found");
        }

        return user;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }
}
