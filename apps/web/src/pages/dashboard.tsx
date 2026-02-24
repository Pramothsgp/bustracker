import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bus, Route, MapPin, Users, Navigation } from "lucide-react";
import { useApiList } from "@/hooks/use-api";

export function DashboardPage() {
  const { data: buses } = useApiList<any>("/buses");
  const { data: routes } = useApiList<any>("/routes");
  const { data: stops } = useApiList<any>("/stops");
  const { data: users } = useApiList<any>("/users");
  const { data: trips } = useApiList<any>("/trips");

  const stats = [
    { label: "Buses", value: buses.length, icon: Bus, color: "text-blue-600" },
    { label: "Routes", value: routes.length, icon: Route, color: "text-green-600" },
    { label: "Stops", value: stops.length, icon: MapPin, color: "text-orange-600" },
    { label: "Users", value: users.length, icon: Users, color: "text-purple-600" },
    { label: "Trips", value: trips.length, icon: Navigation, color: "text-red-600" },
  ];

  const activeTrips = trips.filter((t: any) => t.status === "active");
  const geocodedStops = stops.filter((s: any) => s.lat && s.lng);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTrips.length}</p>
            <p className="text-sm text-muted-foreground">buses currently on route</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geocoded Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {geocodedStops.length} / {stops.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {stops.length > 0 ? Math.round((geocodedStops.length / stops.length) * 100) : 0}% coverage
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
