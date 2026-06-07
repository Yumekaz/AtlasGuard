import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${API_BASE_URL}/events`, {
      auth: { token: getToken() },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  const token = getToken();
  if (token) {
    s.auth = { token };
    if (!s.connected) s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function subscribeIncident(incidentId: string) {
  const s = connectSocket();
  s.emit('joinIncident', incidentId);
}