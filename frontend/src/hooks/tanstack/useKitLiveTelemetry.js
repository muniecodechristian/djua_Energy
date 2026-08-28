// src/hooks/tanstack/useKitLiveTelemetry.js
// Hook combiné : Socket.io live + fallback base de données.
//
// Comportement :
//   1. Souscrit au room Socket.io du kit (subscribe:kit) dès le montage
//   2. Écoute les événements 'telemetry:live' en temps réel (ESP32 actif)
//   3. Injecte les données live dans le cache TanStack Query
//   4. Si aucun événement live → utilise le fallback GET /api/ml/telemetry (BD)
//
// Valeur retournée :
//   { telemetryDocuments, telemetryRecords, latestTelemetry, isLive, isLoading, lastUpdated }

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useKitTelemetryQuery } from './useKitQueries.js';

// ─── Singleton Socket.io ───────────────────────────────────────────────────────
// On réutilise une seule connexion pour toute l'app (évite les reconnexions).
let socketInstance = null;

function getSocket() {
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

    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connecté au serveur :', socketInstance.id);
    });
    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket.io] Déconnecté :', reason);
    });
    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket.io] Erreur de connexion :', err.message);
    });
  }
  return socketInstance;
}

/**
 * Hook principal — télémétrie live + fallback BDD.
 *
 * @param {string | null} kitId - Identifiant du kit à surveiller
 * @returns {{
 *   telemetryDocuments: object[],
 *   telemetryRecords: object[],
 *   latestTelemetry: object | null,
 *   isLive: boolean,
 *   isLoading: boolean,
 *   lastUpdated: string | null,
 *   dataSource: 'live' | 'db' | null
 * }}
 */
export function useKitLiveTelemetry(kitId) {
  const queryClient = useQueryClient();

  // ── État local pour les données Socket.io ─────────────────────────────────
  const [livePayload, setLivePayload] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const liveTimeoutRef = useRef(null);

  // ── Fallback BDD via TanStack Query ───────────────────────────────────────
  const {
    data: telemetryDocuments = [],
    isLoading,
  } = useKitTelemetryQuery(kitId);

  // ── Démarquer comme "plus live" après 60s sans événement ──────────────────
  const resetLiveFlag = useCallback(() => {
    if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    liveTimeoutRef.current = setTimeout(() => {
      setIsLive(false);
      console.log(`[Socket.io] Aucun signal live depuis 60s → kit ${kitId} en mode BD`);
    }, 60_000);
  }, [kitId]);

  // ── Abonnement Socket.io au room du kit ───────────────────────────────────
  useEffect(() => {
    if (!kitId) return;

    const socket = getSocket();

    // Handler de réception de télémétrie live
    const handleLiveTelemetry = (event) => {
      if (event.kitId !== kitId) return;

      console.log(`[Socket.io] Télémétrie live reçue pour kit ${kitId}`, event);

      setLivePayload(event.enriched);
      setIsLive(true);
      setLastUpdated(event.timestamp);

      // Injecter dans le cache TanStack Query pour cohérence
      if (event.enriched) {
        queryClient.setQueryData(['telemetry', kitId], (old = []) => {
          // Mettre le nouveau document en tête de liste
          const newDoc = event.enriched;
          const filtered = (old || []).filter(
            (doc) => doc.request_id !== newDoc.request_id
          );
          return [newDoc, ...filtered].slice(0, 20);
        });
      }

      // Réinitialiser le timer "live"
      resetLiveFlag();
    };

    // S'abonner au room du kit
    const subscribe = () => {
      socket.emit('subscribe:kit', { kitId });
      console.log(`[Socket.io] Souscription au kit : ${kitId}`);
    };

    // S'abonner immédiatement si déjà connecté, sinon attendre la connexion
    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    socket.on('telemetry:live', handleLiveTelemetry);

    return () => {
      // Nettoyage : désabonnement du room
      socket.off('telemetry:live', handleLiveTelemetry);
      socket.off('connect', subscribe);
      socket.emit('unsubscribe:kit', { kitId });
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
      setIsLive(false);
      setLivePayload(null);
    };
  }, [kitId, queryClient, resetLiveFlag]);

  // ── Calcul des données finales (live prioritaire sur BD) ──────────────────
  const effectiveDocs = isLive && livePayload
    ? [livePayload, ...telemetryDocuments].slice(0, 20)
    : telemetryDocuments;

  // Aplatir les records de tous les documents EnrichedTelemetry
  const telemetryRecords = effectiveDocs
    .flatMap((doc) => doc?.records || [])
    .filter(Boolean)
    .sort((a, b) => {
      const ta = Number(a.event_time) || new Date(a.event_time).getTime() || 0;
      const tb = Number(b.event_time) || new Date(b.event_time).getTime() || 0;
      return ta - tb;
    });

  const latestTelemetry = telemetryRecords[telemetryRecords.length - 1] ?? null;

  return {
    telemetryDocuments: effectiveDocs,
    telemetryRecords,
    latestTelemetry,
    isLive,
    isLoading,
    lastUpdated: lastUpdated ?? (latestTelemetry?.event_time ?? null),
    dataSource: isLive ? 'live' : (telemetryDocuments.length > 0 ? 'db' : null),
  };
}
