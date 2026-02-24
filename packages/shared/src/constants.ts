export const BUS_TYPES = ["regular", "deluxe", "ac"] as const;
export type BusType = (typeof BUS_TYPES)[number];

export const BUS_STATUSES = ["active", "maintenance", "retired"] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];

export const USER_ROLES = ["admin", "driver", "conductor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TRIP_STATUSES = ["scheduled", "active", "completed", "cancelled"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const COIMBATORE_CENTER = {
  lat: 11.0168,
  lng: 76.9558,
} as const;

export const DEFAULT_SEARCH_RADIUS_KM = 2;
export const MAX_SEARCH_RADIUS_KM = 10;

export const LOCATION_UPDATE_INTERVAL_MS = 10_000;
export const DEMO_SPEED_KMH = 30;
export const DEMO_TICK_MS = 10_000;

export const MAGIC_LINK_TTL_MINUTES = 15;
export const JWT_DEFAULT_EXPIRY = "7d";

export const REDIS_BUS_TTL_SECONDS = 300; // 5 minutes
