ALTER TABLE "tickets" ADD COLUMN "start_stop_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "end_stop_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_start_stop_id_stops_id_fk" FOREIGN KEY ("start_stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_end_stop_id_stops_id_fk" FOREIGN KEY ("end_stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;