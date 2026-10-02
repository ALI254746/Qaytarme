import { io } from "socket.io-client";

let socket = null;

async function requestToken() {
  const response = await fetch("/api/socket/token", {
    method: "POST",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || typeof result.token !== "string") {
    throw new Error(result.error || "Socket ruxsati olinmadi");
  }
  return result.token;
}

export async function connectChatSocket() {
  const token = await requestToken();
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      throw new Error("NEXT_PUBLIC_SOCKET_URL sozlanmagan");
    }
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
  }

  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}

export async function refreshChatSocketToken() {
  if (socket) socket.auth = { token: await requestToken() };
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}
