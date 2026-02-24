import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, MapPin } from "lucide-react";
import { useApiList } from "@/hooks/use-api";
import type { Stop } from "@bus/shared";

export function StopsPage() {
  const { data: stops } = useApiList<Stop>("/stops");
  const [search, setSearch] = useState("");

  const filtered = stops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const geocoded = stops.filter((s) => s.lat && s.lng).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stops</h1>
        <Badge variant="secondary">
          <MapPin className="mr-1 h-3 w-3" />
          {geocoded} / {stops.length} geocoded
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search stops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tamil Name</TableHead>
            <TableHead>Latitude</TableHead>
            <TableHead>Longitude</TableHead>
            <TableHead>OSM ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.slice(0, 100).map((stop) => (
            <TableRow key={stop.id}>
              <TableCell className="font-medium">{stop.name}</TableCell>
              <TableCell>{stop.nameTa || "-"}</TableCell>
              <TableCell>{stop.lat?.toFixed(6) || <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell>{stop.lng?.toFixed(6) || <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell>{stop.osmId || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length > 100 && (
        <p className="text-sm text-muted-foreground">
          Showing 100 of {filtered.length} stops
        </p>
      )}
    </div>
  );
}
