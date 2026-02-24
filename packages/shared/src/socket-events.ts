export const SOCKET_EVENTS = {
  // Driver -> Server
  LOCATION_UPDATE: "location:update",

  // Server -> Client
  BUS_MOVED: "bus:moved",
  BUS_POSITION: "bus:position",
  NEARBY_UPDATE: "nearby:update",
  BUS_STARTED: "bus:started",
  BUS_STOPPED: "bus:stopped",

  // Client -> Server
  TRACK_ROUTE: "track:route",
  UNTRACK_ROUTE: "untrack:route",
  TRACK_BUS: "track:bus",
  UNTRACK_BUS: "untrack:bus",
  NEARBY_SUBSCRIBE: "nearby:subscribe",
  NEARBY_UNSUBSCRIBE: "nearby:unsubscribe",
} as const;

export interface LocationUpdatePayload {
  tripId: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
}

export interface BusMovedPayload {
  tripId: string;
  busId: string;
  routeId: string;
  routeNumber: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface NearbySubscribePayload {
  lat: number;
  lng: number;
  radiusKm: number;
}
