import { Effect } from "effect";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { buses } from "@bus/db";
import { db } from "../lib/db.js";
import type { CreateBusInput, UpdateBusInput } from "@bus/shared";

export class BusService {
  static list() {
    return Effect.tryPromise({
      try: () => db.select().from(buses),
      catch: (e) => new Error(String(e)),
    });
  }

  static getById(id: string) {
    return Effect.tryPromise({
      try: async () => {
        const [bus] = await db.select().from(buses).where(eq(buses.id, id));
        if (!bus) throw new Error("Not found: Bus not found");
        return bus;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static create(input: CreateBusInput) {
    return Effect.tryPromise({
      try: async () => {
        const [bus] = await db
          .insert(buses)
          .values({ id: createId(), ...input })
          .returning();
        return bus;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : "Conflict: Bus already exists")),
    });
  }

  static update(id: string, input: UpdateBusInput) {
    return Effect.tryPromise({
      try: async () => {
        const [bus] = await db
          .update(buses)
          .set(input)
          .where(eq(buses.id, id))
          .returning();
        if (!bus) throw new Error("Not found: Bus not found");
        return bus;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static delete(id: string) {
    return Effect.tryPromise({
      try: async () => {
        const [bus] = await db
          .delete(buses)
          .where(eq(buses.id, id))
          .returning();
        if (!bus) throw new Error("Not found: Bus not found");
        return { deleted: true };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }
}
