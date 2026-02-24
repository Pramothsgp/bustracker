import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getTrackingSocket(): Socket {
  if (!socket) {
    socket = io("/tracking", {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
