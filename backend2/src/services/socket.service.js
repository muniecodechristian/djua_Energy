// src/services/socket.service.js
// Gestion de Socket.io : authentification JWT, rooms personnelles, rooms par kit,
// et émissions temps réel sécurisées.

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/env.config.js';
import User from '../models/user.model.js';
import cookie from 'cookie';

/** @type {Server | null} */
let io = null;

/**
 * Parse un cookie token depuis les headers du handshake Socket.io.
 * Supporte : cookie HttpOnly (prioritaire) et auth.token du handshake.
 * @param {import('socket.io').Socket} socket
 * @returns {string|null}
 */
function extractToken(socket) {
  // 1. Cookie HttpOnly (même mécanisme que le middleware protect)
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader) {
    const parse = cookie.parse || cookie.default?.parse;
    const cookies = typeof parse === 'function' ? parse(cookieHeader) : {};
    if (cookies.token) return cookies.token;
  }

  // 2. Fallback: token passé dans auth du handshake (utile pour React Native)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  return null;
}

/**
 * Initialise Socket.io avec le serveur HTTP.
 * Authentifie chaque connexion via JWT et auto-join les rooms personnelles.
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Autorise toutes les origines pour Socket.io tout en conservant credentials: true
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  // ── Middleware d'authentification Socket.io ──────────────────────────────────
  io.use(async (socket, next) => {
    const token = extractToken(socket);

    if (!token) {
      // Connexion anonyme autorisée (pour la page publique / dashboard sans login)
      // mais sans accès aux rooms privées
      socket.data.authenticated = false;
      socket.data.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('_id nom prenom role zone status').lean();

      if (!user || user.status === 'suspended') {
        return next(new Error('Authentification refusée : compte invalide ou suspendu'));
      }

      socket.data.authenticated = true;
      socket.data.user = user;
      next();
    } catch (err) {
      // Token invalide/expiré — on refuse la connexion
      return next(new Error('Authentification refusée : token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    const isAuth = socket.data.authenticated;

    if (isAuth && user) {
      // ── Auto-join room personnelle ────────────────────────────────────────────
      const userRoom = `user:${user._id}`;
      socket.join(userRoom);
      console.log(`[Socket.io] ${user.prenom} ${user.nom} (${user.role}) → room ${userRoom}`);

      // ── Auto-join room de zone ────────────────────────────────────────────────
      if (user.zone) {
        const zoneRoom = `zone:${user.zone}`;
        socket.join(zoneRoom);
        console.log(`[Socket.io] ${user.prenom} ${user.nom} → room ${zoneRoom}`);
      }

      // Confirmation au client
      socket.emit('authenticated', {
        userId: user._id,
        role: user.role,
        zone: user.zone,
      });
    } else {
      console.log(`[Socket.io] Connexion anonyme : ${socket.id}`);
    }

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
      if (isAuth && user) {
        console.log(`[Socket.io] ${user.prenom} ${user.nom} déconnecté`);
      } else {
        console.log(`[Socket.io] Client anonyme déconnecté : ${socket.id}`);
      }
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

export function emitGeofenceResolved(kitId) {
  if (io && kitId) io.emit('geofence_resolved', { kitId });
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

