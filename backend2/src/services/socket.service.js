import { Server } from 'socket.io';

/** @type {Server | null} */
let io = null;

/**
 * Initialise Socket.io avec le serveur HTTP.
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'https://orangeenergyapi.vercel.app'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connecté : ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client déconnecté : ${socket.id}`);
    });
  });

  return io;
}

/**
 * Récupère l'instance globale de Socket.io.
 * @returns {Server}
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io n\'est pas initialisé.');
  }
  return io;
}

/**
 * Émet une alerte de geofencing vers tous les clients connectés.
 * @param {object} alertData
 */
export function emitGeofenceAlert(alertData) {
  if (io) {
    io.emit('geofence_alert', alertData);
    console.log(`[Socket.io] Alerte émise pour le kit ${alertData.kitId}`);
  }
}
