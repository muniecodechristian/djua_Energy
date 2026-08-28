// src/services/socket.service.js
// Gestion de Socket.io : connexions clients, rooms par kit, émissions temps réel.

import { Server } from 'socket.io';

/** @type {Server | null} */
let io = null;

/**
 * Initialise Socket.io avec le serveur HTTP.
 * Gère les rooms par kit pour les émissions ciblées de télémétrie live.
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

    // ── Abonnement à un room de kit ────────────────────────────────────────────
    // Le frontend envoie 'subscribe:kit' avec { kitId } pour recevoir
    // les événements 'telemetry:live' en temps réel pour ce kit.
    socket.on('subscribe:kit', ({ kitId } = {}) => {
      if (!kitId) return;
      const room = `kit:${kitId}`;
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} souscrit au room ${room}`);
      // Confirmation immédiate au client
      socket.emit('subscribed:kit', { kitId, room });
    });

    // ── Désabonnement d'un room de kit ────────────────────────────────────────
    socket.on('unsubscribe:kit', ({ kitId } = {}) => {
      if (!kitId) return;
      const room = `kit:${kitId}`;
      socket.leave(room);
      console.log(`[Socket.io] Client ${socket.id} a quitté le room ${room}`);
    });

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
    console.log(`[Socket.io] Alerte géofencing émise pour le kit ${alertData.kitId}`);
  }
}

/**
 * Émet les données de télémétrie live vers le room du kit concerné.
 * Seuls les clients abonnés à ce kit via 'subscribe:kit' reçoivent l'événement.
 *
 * @param {string} kitId   - Identifiant du kit
 * @param {object} payload - Données enrichies (EnrichedTelemetry)
 * @param {object} rawPayload - Données brutes (Telemetry)
 */
export function emitLiveTelemetry(kitId, payload, rawPayload = null) {
  if (!io || !kitId) return;

  const room = `kit:${kitId}`;
  const event = {
    kitId,
    timestamp: new Date().toISOString(),
    enriched: payload,
    raw: rawPayload,
  };

  io.to(room).emit('telemetry:live', event);
  console.log(`[Socket.io] Télémétrie live émise → room ${room}`);
}
