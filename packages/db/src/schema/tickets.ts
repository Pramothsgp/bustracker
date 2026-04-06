import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { trips } from "./trips";
import { users } from "./users";
import { stops } from "./stops";

export const tickets = pgTable(
  "tickets",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    startStopId: text("start_stop_id").references(() => stops.id),
    endStopId: text("end_stop_id").references(() => stops.id),
    passengerCount: integer("passenger_count").notNull().default(1),
    status: text("status", { enum: ["active", "used", "cancelled"] })
      .notNull()
      .default("active"),
    price: integer("price"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tickets_trip_idx").on(table.tripId),
    index("tickets_user_idx").on(table.userId),
    index("tickets_status_idx").on(table.status),
  ],
);
