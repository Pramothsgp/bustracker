import { z } from "zod";
import {
  BUS_TYPES,
  BUS_STATUSES,
  USER_ROLES,
  TRIP_STATUSES,
} from "../constants";

// ── Auth ──
export const OtpRequestSchema = z.object({
  email: z.string().email(),
});

export const OtpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ── Buses ──
export const CreateBusSchema = z.object({
  registrationNumber: z.string().min(1).max(20),
  type: z.enum(BUS_TYPES).default("regular"),
  capacity: z.number().int().positive().optional(),
});

export const UpdateBusSchema = CreateBusSchema.partial().extend({
  status: z.enum(BUS_STATUSES).optional(),
});

// ── Routes ──
export const RouteSearchSchema = z.object({
  q: z.string().min(1),
});

// ── Stops ──
export const NearbyStopsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(10).default(2),
});

// ── Users ──
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// ── Trips ──
export const StartTripSchema = z.object({
  busId: z.string().min(1),
  routeId: z.string().min(1),
  conductorId: z.string().optional(),
});

// ── Tracking ──
export const NearbyBusesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(10).default(2),
});

// ── Pagination ──
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Tickets ──
export const CreateTicketSchema = z.object({
  tripId: z.string().min(1),
  passengerCount: z.number().int().positive().default(1),
  price: z.number().int().positive().optional(),
});
