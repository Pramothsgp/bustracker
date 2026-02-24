import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useApiList, useApiGet } from "@/hooks/use-api";
import type { Route } from "@bus/shared";

export function RoutesPage() {
  const { data: routes } = useApiList<Route>("/routes");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: routeDetail } = useApiGet<any>(selectedId ? `/routes/${selectedId}` : null);

  const filtered = routes.filter(
    (r) =>
      r.routeNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.routeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Routes</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((route) => (
                <TableRow
                  key={route.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(route.id)}
                  data-state={selectedId === route.id ? "selected" : undefined}
                >
                  <TableCell>
                    <Badge variant="outline">{route.routeNumber}</Badge>
                  </TableCell>
                  <TableCell>{route.routeName}</TableCell>
                  <TableCell>{route.origin}</TableCell>
                  <TableCell>{route.destination}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {routeDetail && (
          <Card>
            <CardHeader>
              <CardTitle>Route {routeDetail.routeNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{routeDetail.routeName}</p>
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Stops ({routeDetail.stops?.length || 0})
                </h4>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {routeDetail.stops?.map((stop: any, i: number) => (
                    <div key={stop.id} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                        {i + 1}
                      </span>
                      <span className={stop.lat ? "" : "text-muted-foreground"}>
                        {stop.name}
                      </span>
                      {stop.lat && (
                        <span className="ml-auto text-xs text-green-600">GPS</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
