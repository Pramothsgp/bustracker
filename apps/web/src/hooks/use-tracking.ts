import { useState, useEffect, useRef } from "react";
import { getTrackingSocket } from "@/lib/socket";
import type { ActiveBusPosition } from "@bus/shared";
import { SOCKET_EVENTS } from "@bus/shared";

export function useTracking() {
  const [buses, setBuses] = useState<Map<string, ActiveBusPosition>>(new Map());
  const socketRef = useRef(getTrackingSocket());

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();

    socket.on(SOCKET_EVENTS.BUS_MOVED, (data: ActiveBusPosition) => {
      setBuses((prev) => {
        const next = new Map(prev);
        next.set(data.tripId, data);
        return next;
      });
    });

    socket.on(SOCKET_EVENTS.BUS_STOPPED, (data: { tripId: string }) => {
      setBuses((prev) => {
        const next = new Map(prev);
        next.delete(data.tripId);
        return next;
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.BUS_MOVED);
      socket.off(SOCKET_EVENTS.BUS_STOPPED);
      socket.disconnect();
    };
  }, []);

  return { buses: Array.from(buses.values()), busMap: buses };
}
