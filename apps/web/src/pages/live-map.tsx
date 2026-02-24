import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useTracking } from "@/hooks/use-tracking";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COIMBATORE_CENTER } from "@bus/shared";
import type { ActiveBusPosition } from "@bus/shared";

const busIcon = new L.DivIcon({
  className: "bus-marker",
  html: `<div style="background:#1d4ed8;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🚌</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function AutoFit({ buses }: { buses: ActiveBusPosition[] }) {
  const map = useMap();
  useEffect(() => {
    if (buses.length === 0) return;
    const bounds = L.latLngBounds(buses.map((b) => [b.lat, b.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [buses.length > 0]);
  return null;
}

export function LiveMapPage() {
  const { buses } = useTracking();
  const [initialBuses, setInitialBuses] = useState<ActiveBusPosition[]>([]);

  useEffect(() => {
    api.get<ActiveBusPosition[]>("/tracking/buses").then(setInitialBuses).catch(() => {});
  }, []);

  const allBuses = buses.length > 0 ? buses : initialBuses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Map</h1>
        <Badge variant="outline">{allBuses.length} active buses</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-12rem)]">
            <MapContainer
              center={[COIMBATORE_CENTER.lat, COIMBATORE_CENTER.lng]}
              zoom={13}
              className="h-full w-full rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AutoFit buses={allBuses} />
              {allBuses.map((bus) => (
                <Marker key={bus.tripId} position={[bus.lat, bus.lng]} icon={busIcon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Route {bus.routeNumber}</strong>
                      <br />
                      Speed: {bus.speed ?? "-"} km/h
                      <br />
                      Updated: {new Date(bus.timestamp).toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
