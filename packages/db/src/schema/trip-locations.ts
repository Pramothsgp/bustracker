import {
  pgTable,
  text,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { trips } from "./trips";

export const tripLocations = pgTable(
  "trip_locations",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    speed: real("speed"),
    heading: real("heading"),
    accuracy: real("accuracy"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trip_locations_trip_idx").on(table.tripId),
    index("trip_locations_recorded_idx").on(table.recordedAt),
  ]
);
