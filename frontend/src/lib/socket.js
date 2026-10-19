import { io } from 'socket.io-client';

let socketInstance = null;

export function getAppSocket() {
  if (!socketInstance) {
    const isLocalHost = typeof window !== 'undefined'
      && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const serverUrl = import.meta.env.VITE_API_URL
      ?? (isLocalHost ? 'http://localhost:5000' : 'https://djua-energy-backend.onrender.com');

    socketInstance = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
  }
  return socketInstance;
}
