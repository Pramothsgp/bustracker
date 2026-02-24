import { Effect } from "effect";
import { eq, and, gt, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users, magicLinkTokens } from "@bus/db";
import { db } from "../lib/db.js";
import { signToken } from "../lib/jwt.js";
import { env } from "../env.js";
import crypto from "crypto";

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
        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static requestMagicLink(email: string) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          throw new Error("Not found: User not found");
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + env.MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);

        await db.insert(magicLinkTokens).values({
          id: createId(),
          userId: user.id,
          token,
          expiresAt,
        });

        // In production, send email via Resend. For now, log the token.
        console.log(`[Magic Link] Token for ${email}: ${token}`);

        return { message: "Magic link sent" };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static verifyMagicLink(token: string) {
    return Effect.tryPromise({
      try: async () => {
        const [linkToken] = await db
          .select()
          .from(magicLinkTokens)
          .where(
            and(
              eq(magicLinkTokens.token, token),
              isNull(magicLinkTokens.usedAt),
              gt(magicLinkTokens.expiresAt, new Date())
            )
          );

        if (!linkToken) {
          throw new Error("Unauthorized: Invalid or expired token");
        }

        // Mark as used
        await db
          .update(magicLinkTokens)
          .set({ usedAt: new Date() })
          .where(eq(magicLinkTokens.id, linkToken.id));

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, linkToken.userId));

        if (!user) {
          throw new Error("Not found: User not found");
        }

        const jwt = signToken({ userId: user.id, role: user.role });
        return { token: jwt, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
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
