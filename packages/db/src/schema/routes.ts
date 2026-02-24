import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const routes = pgTable(
  "routes",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    routeNumber: text("route_number").notNull().unique(),
    routeName: text("route_name").notNull(),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("routes_number_idx").on(table.routeNumber),
  ]
);
