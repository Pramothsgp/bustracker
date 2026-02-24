import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface DemoStatus {
  running: boolean;
  busCount: number;
  buses: { tripId: string; routeNumber: string; currentStop?: string; nextStop?: string }[];
}

export function DemoPage() {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.get<DemoStatus>("/demo/status");
      setStatus(data);
    } catch {
      setStatus({ running: false, busCount: 0, buses: [] });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.post("/demo/start");
      await fetchStatus();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start demo");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.post("/demo/stop");
      await fetchStatus();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to stop demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Demo Mode</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Demo Simulation
            {status?.running && (
              <Badge className="bg-green-600">Running</Badge>
            )}
            {status && !status.running && (
              <Badge variant="secondary">Stopped</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Simulate virtual buses moving along routes for presentations and testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleStart} disabled={loading || status?.running === true}>
              <Play className="mr-2 h-4 w-4" /> Start Demo
            </Button>
            <Button variant="destructive" onClick={handleStop} disabled={loading || !status?.running}>
              <Square className="mr-2 h-4 w-4" /> Stop Demo
            </Button>
            <Button variant="outline" onClick={fetchStatus}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {status?.running && status.buses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Virtual Buses ({status.busCount})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {status.buses.map((bus) => (
                  <div key={bus.tripId} className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">Route {bus.routeNumber}</div>
                    {bus.currentStop && (
                      <div className="text-muted-foreground">
                        At: {bus.currentStop}
                      </div>
                    )}
                    {bus.nextStop && (
                      <div className="text-muted-foreground">
                        Next: {bus.nextStop}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
