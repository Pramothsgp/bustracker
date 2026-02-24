import { pgTable, text, integer, primaryKey, index } from "drizzle-orm/pg-core";
import { routes } from "./routes";
import { stops } from "./stops";

export const routeStops = pgTable(
  "route_stops",
  {
    routeId: text("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    stopId: text("stop_id")
      .notNull()
      .references(() => stops.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.routeId, table.stopId] }),
    index("route_stops_route_idx").on(table.routeId),
    index("route_stops_stop_idx").on(table.stopId),
  ]
);
