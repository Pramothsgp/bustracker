import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { buses } from "./buses";
import { routes } from "./routes";
import { users } from "./users";

export const trips = pgTable(
  "trips",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    busId: text("bus_id")
      .notNull()
      .references(() => buses.id, { onDelete: "cascade" }),
    routeId: text("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .references(() => users.id, { onDelete: "cascade" }),
    conductorId: text("conductor_id").references(() => users.id),
    status: text("status", {
      enum: ["scheduled", "active", "completed", "cancelled"],
    })
      .notNull()
      .default("scheduled"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trips_bus_idx").on(table.busId),
    index("trips_route_idx").on(table.routeId),
    index("trips_driver_idx").on(table.driverId),
    index("trips_status_idx").on(table.status),
    // Only one active trip per bus at a time
    uniqueIndex("trips_active_bus_unique")
      .on(table.busId)
      .where(sql`${table.status} = 'active'`),
  ]
);
