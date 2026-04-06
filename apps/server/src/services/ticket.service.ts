import { Effect } from "effect";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { tickets, trips, buses } from "@bus/db";
import { db } from "../lib/db.js";
import type { CreateTicketInput } from "@bus/shared";

export class TicketService {
  static create(input: CreateTicketInput, userId: string) {
    return Effect.tryPromise({
      try: async () => {
        // verify trip is active
        const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId));
        if (!trip || trip.status !== "active") {
          throw new Error("Conflict: Trip is not active");
        }

        const [ticket] = await db
          .insert(tickets)
          .values({
            id: createId(),
            tripId: input.tripId,
            passengerCount: input.passengerCount ?? 1,
            price: input.price,
            userId: userId // Optional, track who issued the ticket
          })
          .returning();
          
        return ticket;
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static getTripPassengers(tripId: string) {
    return Effect.tryPromise({
      try: async () => {
        // Get trip and associated bus
        const [tripResult] = await db
          .select({
            id: trips.id,
            busCapacity: buses.capacity
          })
          .from(trips)
          .innerJoin(buses, eq(trips.busId, buses.id))
          .where(eq(trips.id, tripId));

        if (!tripResult) {
          throw new Error("Not found: Trip not found");
        }

        // Get total passenger count (active tickets)
        const ticketsList = await db
          .select({ passengerCount: tickets.passengerCount })
          .from(tickets)
          .where(eq(tickets.tripId, tripId));
        
        const currentPassengers = ticketsList.reduce((acc, t) => acc + (t.passengerCount || 0), 0);
        const capacity = tripResult.busCapacity || 0;
        const remainingSeats = capacity > 0 ? Math.max(0, capacity - currentPassengers) : 0;

        return {
          tripId,
          capacity,
          currentPassengers,
          remainingSeats
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }

  static getBusPassengers(busId: string) {
    return Effect.tryPromise({
      try: async () => {
        // Find active trip for bus
        const [tripInfo] = await db
          .select({
            id: trips.id,
            capacity: buses.capacity
          })
          .from(trips)
          .innerJoin(buses, eq(trips.busId, buses.id))
          .where(sql`${trips.busId} = ${busId} AND ${trips.status} = 'active'`);

        if (!tripInfo) {
          throw new Error("No active trip for this bus");
        }

        const ticketsList = await db
          .select({ passengerCount: tickets.passengerCount })
          .from(tickets)
          .where(eq(tickets.tripId, tripInfo.id));
        
        const currentPassengers = ticketsList.reduce((acc, t) => acc + (t.passengerCount || 0), 0);
        const capacity = tripInfo.capacity || 0;
        const remainingSeats = capacity > 0 ? Math.max(0, capacity - currentPassengers) : 0;

        return {
          tripId: tripInfo.id,
          capacity,
          currentPassengers,
          remainingSeats
        };
      },
      catch: (e) => new Error(String(e instanceof Error ? e.message : e)),
    });
  }
}
