import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

const SOCKET_URL =
  Constants.expoConfig?.extra?.socketUrl ||
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  "http://localhost:3000";

let socket: Socket | null = null;

export function getTrackingSocket(): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/tracking`, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}
