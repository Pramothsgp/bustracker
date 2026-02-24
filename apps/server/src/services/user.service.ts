import { Effect } from "effect";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "@bus/db";
import { db } from "../lib/db.js";
import type { CreateUserInput, UpdateUserInput } from "@bus/shared";

export class UserService {
  static list() {
    return Effect.tryPromise({
      try: () =>
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users),
      catch: (e) => new Error(String(e)),
    });
  }

  static create(input: CreateUserInput) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .insert(users)
          .values({ id: createId(), ...input })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
            createdAt: users.createdAt,
          });
        return user;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : "Conflict: User already exists")),
    });
  }

  static update(id: string, input: UpdateUserInput) {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await db
          .update(users)
          .set(input)
          .where(eq(users.id, id))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
            createdAt: users.createdAt,
          });
        if (!user) throw new Error("Not found: User not found");
        return user;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }
}
