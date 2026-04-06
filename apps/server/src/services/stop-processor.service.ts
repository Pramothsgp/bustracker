import { db } from "../lib/db.js";
import { tickets, stops, trips } from "@bus/db";
import { eq, and, inArray } from "drizzle-orm";

export class StopProcessorService {
  /**
   * Evaluates incoming coordinate bursts to determine if the bus has reached 
   * the designated drop-off points for any actively held tickets.
   */
  static async checkLocationDropoffs(tripId: string, lat: number, lng: number) {
    try {
      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      if (!trip) return;

      // Approx 150m radius (1 degree coords ~= 111km) -> 0.0015
      const THRESHOLD = 0.0015;

      // Find all tickets active on this trip that have an end destination
      const allActiveTickets = await db
        .select({
          ticketId: tickets.id,
          lat: stops.lat,
          lng: stops.lng,
        })
        .from(tickets)
        .innerJoin(stops, eq(tickets.endStopId, stops.id))
        .where(
          and(
            eq(tickets.tripId, tripId),
            eq(tickets.status, "active")
          )
        );

      const reachedTicketIds = allActiveTickets
        .filter((t) => {
          if (!t.lat || !t.lng) return false;
          // Mathematical distance to destination
          const distSq = Math.pow(t.lat - lat, 2) + Math.pow(t.lng - lng, 2);
          return distSq <= THRESHOLD * THRESHOLD;
        })
        .map(t => t.ticketId);

      // Mass execute state change to "used" (using the schema "used" enum)
      if (reachedTicketIds.length > 0) {
        await db
          .update(tickets)
          .set({ status: "used" })
          .where(inArray(tickets.id, reachedTicketIds));
          
        console.log(`[StopProcessor] Auto-completed ${reachedTicketIds.length} boarding passes.`);
      }
    } catch (e) {
      console.error("[StopProcessor] Error verifying dropoffs:", e);
    }
  }
}
