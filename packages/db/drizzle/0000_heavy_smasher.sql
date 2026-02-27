CREATE TABLE "buses" (
	"id" text PRIMARY KEY NOT NULL,
	"registration_number" text NOT NULL,
	"type" text DEFAULT 'regular' NOT NULL,
	"capacity" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buses_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"route_id" text NOT NULL,
	"stop_id" text NOT NULL,
	"sequence" integer NOT NULL,
	CONSTRAINT "route_stops_route_id_stop_id_pk" PRIMARY KEY("route_id","stop_id")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"route_number" text NOT NULL,
	"route_name" text NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routes_route_number_unique" UNIQUE("route_number")
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ta" text,
	"lat" real,
	"lng" real,
	"osm_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"speed" real,
	"heading" real,
	"accuracy" real,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" text PRIMARY KEY NOT NULL,
	"bus_id" text NOT NULL,
	"route_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"conductor_id" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_active_bus_unique" UNIQUE NULLS NOT DISTINCT("bus_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'driver' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_conductor_id_users_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buses_registration_idx" ON "buses" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "buses_status_idx" ON "buses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "otp_codes_user_code_idx" ON "otp_codes" USING btree ("user_id","code");--> statement-breakpoint
CREATE INDEX "otp_codes_user_idx" ON "otp_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "route_stops_route_idx" ON "route_stops" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "route_stops_stop_idx" ON "route_stops" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "routes_number_idx" ON "routes" USING btree ("route_number");--> statement-breakpoint
CREATE INDEX "stops_name_idx" ON "stops" USING btree ("name");--> statement-breakpoint
CREATE INDEX "trip_locations_trip_idx" ON "trip_locations" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_locations_recorded_idx" ON "trip_locations" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "trips_bus_idx" ON "trips" USING btree ("bus_id");--> statement-breakpoint
CREATE INDEX "trips_route_idx" ON "trips" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "trips_driver_idx" ON "trips" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");