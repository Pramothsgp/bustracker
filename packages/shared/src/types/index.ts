import type { z } from "zod";
import type {
  CreateBusSchema,
  UpdateBusSchema,
  CreateUserSchema,
  UpdateUserSchema,
  StartTripSchema,
  NearbyBusesSchema,
  PaginationSchema,
  CreateTicketSchema,
} from "../schemas/index";
import type { BusType, BusStatus, UserRole, TripStatus } from "../constants";

export type CreateBusInput = z.infer<typeof CreateBusSchema>;
export type UpdateBusInput = z.infer<typeof UpdateBusSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type StartTripInput = z.infer<typeof StartTripSchema>;
export type NearbyBusesInput = z.infer<typeof NearbyBusesSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export interface Stop {
  id: string;
  name: string;
  nameTa: string | null;
  lat: number | null;
  lng: number | null;
  osmId: string | null;
  createdAt: Date;
}

export interface Route {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  createdAt: Date;
}

export interface RouteWithStops extends Route {
  stops: (Stop & { sequence: number })[];
}

export interface Bus {
  id: string;
  registrationNumber: string;
  type: BusType;
  capacity: number | null;
  status: BusStatus;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  passwordHash: string | null;
  createdAt: Date;
}

export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  conductorId: string | null;
  status: TripStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}

export interface ActiveBusPosition {
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
}
