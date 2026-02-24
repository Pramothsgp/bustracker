import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useApiList } from "@/hooks/use-api";

interface TripRow {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  conductorId: string | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export function TripsPage() {
  const { data: trips } = useApiList<TripRow>("/trips");

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "completed") return "secondary";
    if (s === "cancelled") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Trips</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Ended</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-mono text-xs">{trip.id.slice(0, 12)}...</TableCell>
              <TableCell>
                <Badge variant={statusColor(trip.status)}>{trip.status}</Badge>
              </TableCell>
              <TableCell>
                {trip.startedAt ? new Date(trip.startedAt).toLocaleString() : "-"}
              </TableCell>
              <TableCell>
                {trip.endedAt ? new Date(trip.endedAt).toLocaleString() : "-"}
              </TableCell>
            </TableRow>
          ))}
          {trips.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No trips yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
