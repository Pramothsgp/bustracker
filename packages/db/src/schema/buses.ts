import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const buses = pgTable(
  "buses",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    registrationNumber: text("registration_number").notNull().unique(),
    type: text("type", { enum: ["regular", "deluxe", "ac"] })
      .notNull()
      .default("regular"),
    capacity: integer("capacity"),
    status: text("status", { enum: ["active", "maintenance", "retired"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("buses_registration_idx").on(table.registrationNumber),
    index("buses_status_idx").on(table.status),
  ]
);
