import { Router } from "express";
import { effectHandler } from "../lib/effect-handler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { TicketService } from "../services/ticket.service.js";
import { CreateTicketSchema } from "@bus/shared";

const router = Router();

// Get the passenger counts for a trip
router.get("/trip/:tripId/passengers", effectHandler((req) => TicketService.getTripPassengers(req.params.tripId as string)));

// Get the passenger counts for an active bus
router.get("/bus/:busId/passengers", effectHandler((req) => TicketService.getBusPassengers(req.params.busId as string)));

// Create a new ticket
router.post(
  "/",
  authenticate,
  validate(CreateTicketSchema),
  effectHandler((req) => TicketService.create(req.body, req.user!.userId))
);

export default router;
