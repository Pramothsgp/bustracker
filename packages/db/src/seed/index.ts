import { createDb } from "../client.js";
import { stops, routes, routeStops, users, tripLocations, trips, buses, otpCodes } from "../schema/index.js";
import { createId } from "@paralleldrive/cuid2";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "data");

// ── CSV parser (simple, no deps) ──
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

// ── Fuzzy match for OSM stop names ──
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(name: string, candidates: { name: string; lat: number; lon: number }[]): { lat: number; lon: number } | null {
  const normalized = normalize(name);
  if (normalized.length < 3) return null;

  // Exact match first
  for (const c of candidates) {
    if (normalize(c.name) === normalized) return { lat: c.lat, lon: c.lon };
  }

  // Contains match — only if the matching portion is at least 5 chars
  // and covers at least 60% of the shorter string
  for (const c of candidates) {
    const cn = normalize(c.name);
    if (cn.length < 3) continue;
    const shorter = Math.min(cn.length, normalized.length);
    const longer = Math.max(cn.length, normalized.length);
    if (cn.includes(normalized) || normalized.includes(cn)) {
      if (shorter >= 5 && shorter / longer >= 0.6) {
        return { lat: c.lat, lon: c.lon };
      }
    }
  }
  return null;
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const db = createDb(databaseUrl);
  console.log("🌱 Starting seed...\n");

  // ── 0. Clear existing data (order matters for FK constraints) ──
  console.log("🧹 Clearing existing data...");
  await db.delete(tripLocations);
  await db.delete(trips);
  await db.delete(routeStops);
  await db.delete(buses);
  await db.delete(routes);
  await db.delete(stops);
  await db.delete(otpCodes);
  await db.delete(users);
  console.log("✅ Cleared existing data\n");

  // ── 1. Parse data files ──
  const stopsMaster = parseCSV(readFileSync(resolve(dataDir, "stops_master.csv"), "utf-8"));
  const stopsGeocoded = parseCSV(readFileSync(resolve(dataDir, "stops_geocoded.csv"), "utf-8"));
  const routeStopsCsv = parseCSV(readFileSync(resolve(dataDir, "route_stops.csv"), "utf-8"));
  const routesJson: { route_number: string; route_name: string; stops: string[] }[] = JSON.parse(
    readFileSync(resolve(dataDir, "routes.json"), "utf-8")
  );
  const osmStops: { id: number; lat: number; lon: number; tags: { name?: string; "name:ta"?: string } }[] = JSON.parse(
    readFileSync(resolve(dataDir, "osm_bus_stops.json"), "utf-8")
  );

  // ── 2. Build geocoded lookup ──
  const geocodedMap = new Map<string, { lat: number; lng: number }>();
  for (const row of stopsGeocoded) {
    if (row.lat && row.lng && row.lat !== "" && row.lng !== "") {
      geocodedMap.set(row.stop_id, { lat: parseFloat(row.lat), lng: parseFloat(row.lng) });
    }
  }

  // ── 3. Build OSM candidates ──
  const osmCandidates = osmStops
    .filter((s) => s.tags?.name)
    .map((s) => ({
      name: s.tags.name!,
      nameTa: s.tags["name:ta"] || null,
      lat: s.lat,
      lon: s.lon,
      osmId: String(s.id),
    }));

  console.log(`📊 Data: ${stopsMaster.length} stops, ${routesJson.length} routes, ${routeStopsCsv.length} route-stop pairs`);
  console.log(`📍 Geocoded: ${geocodedMap.size} from CSV, ${osmCandidates.length} OSM candidates\n`);

  // ── 4. Insert stops ──
  const stopIdMap = new Map<string, string>(); // original stop_id -> cuid2
  let geocodedCount = 0;

  const stopRecords = stopsMaster.map((row) => {
    const cuid = createId();
    stopIdMap.set(row.stop_id, cuid);

    let lat: number | null = null;
    let lng: number | null = null;
    let osmId: string | null = null;
    let nameTa: string | null = null;

    // Try geocoded CSV first
    const geo = geocodedMap.get(row.stop_id);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      geocodedCount++;
    } else {
      // Try fuzzy match against OSM stops
      const match = fuzzyMatch(row.stop_name, osmCandidates);
      if (match) {
        lat = match.lat;
        lng = match.lon;
        geocodedCount++;
      }
    }

    // Try to get Tamil name from OSM
    const osmMatch = osmCandidates.find(
      (c) => normalize(c.name) === normalize(row.stop_name)
    );
    if (osmMatch) {
      nameTa = osmMatch.nameTa;
      if (!osmId) osmId = osmMatch.osmId;
    }

    return {
      id: cuid,
      name: row.stop_name,
      nameTa,
      lat,
      lng,
      osmId,
    };
  });

  // Insert in batches of 100
  for (let i = 0; i < stopRecords.length; i += 100) {
    const batch = stopRecords.slice(i, i + 100);
    await db.insert(stops).values(batch);
  }
  console.log(`✅ Inserted ${stopRecords.length} stops (${geocodedCount} geocoded)\n`);

  // ── 5. Insert routes ──
  const routeIdMap = new Map<string, string>(); // route_number -> cuid2

  const routeRecords = routesJson.map((r) => {
    const cuid = createId();
    routeIdMap.set(r.route_number, cuid);

    // Parse origin/destination from route_name (format: "Origin → Destination")
    const parts = r.route_name.split("→").map((s) => s.trim());
    return {
      id: cuid,
      routeNumber: r.route_number,
      routeName: r.route_name,
      origin: parts[0] || r.route_name,
      destination: parts[1] || parts[0] || r.route_name,
    };
  });

  for (let i = 0; i < routeRecords.length; i += 100) {
    const batch = routeRecords.slice(i, i + 100);
    await db.insert(routes).values(batch);
  }
  console.log(`✅ Inserted ${routeRecords.length} routes\n`);

  // ── 6. Insert route_stops (deduplicated) ──
  const routeStopRecords: { routeId: string; stopId: string; sequence: number }[] = [];
  const seenRouteStops = new Set<string>();
  let skipped = 0;
  let duplicates = 0;

  for (const row of routeStopsCsv) {
    const routeId = routeIdMap.get(row.route_number);
    const stopId = stopIdMap.get(row.stop_id);
    if (routeId && stopId) {
      const key = `${routeId}:${stopId}`;
      if (seenRouteStops.has(key)) {
        duplicates++;
        continue;
      }
      seenRouteStops.add(key);
      routeStopRecords.push({
        routeId,
        stopId,
        sequence: parseInt(row.stop_sequence, 10),
      });
    } else {
      skipped++;
    }
  }

  for (let i = 0; i < routeStopRecords.length; i += 200) {
    const batch = routeStopRecords.slice(i, i + 200);
    await db.insert(routeStops).values(batch);
  }
  console.log(`✅ Inserted ${routeStopRecords.length} route-stops (${skipped} skipped, ${duplicates} duplicates removed)\n`);

  // ── 7. Insert admin user ──
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bustracker.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Hash password with Bun's native hasher
  const passwordHash = await Bun.password.hash(adminPassword, {
    algorithm: "bcrypt",
    cost: 10,
  });

  await db.insert(users).values({
    id: createId(),
    name: "Admin",
    email: adminEmail,
    role: "admin",
    passwordHash,
  });
  console.log(`✅ Inserted admin user: ${adminEmail}\n`);

  console.log("🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
