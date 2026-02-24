import { pgTable, text, real, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const stops = pgTable(
  "stops",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    nameTa: text("name_ta"),
    lat: real("lat"),
    lng: real("lng"),
    osmId: text("osm_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("stops_name_idx").on(table.name),
  ]
);
