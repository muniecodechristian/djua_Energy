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
import { useKitTelemetryQuery } from './useKitQueries.js';
import { getAppSocket } from '../../lib/socket.js';

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
  const [liveSnapshot, setLiveSnapshot] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const liveTimeoutRef = useRef(null);
  const currentLiveSnapshot = liveSnapshot?.kitId === kitId ? liveSnapshot : null;
  const isLive = liveStatus?.kitId === kitId && liveStatus.active;
  const livePayload = currentLiveSnapshot?.payload ?? null;

  // ── Fallback BDD via TanStack Query ───────────────────────────────────────
  const {
    data: telemetryDocuments = [],
    isLoading,
  } = useKitTelemetryQuery(kitId);

  // ── Démarquer comme "plus live" après 60s sans événement ──────────────────
  const resetLiveFlag = useCallback((intervalSeconds) => {
    if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    const intervalMs = Number(intervalSeconds) * 1000;
    const timeoutMs = Number.isFinite(intervalMs) && intervalMs > 0
      ? Math.min(Math.max(60_000, intervalMs * 2), 3_600_000)
      : 60_000;
    liveTimeoutRef.current = setTimeout(() => {
      setLiveStatus({ kitId, active: false });
      console.log(`[Socket.io] Délai de réception live dépassé pour le kit ${kitId} → mode historique`);
    }, timeoutMs);
  }, [kitId]);

  // ── Abonnement Socket.io au room du kit ───────────────────────────────────
  useEffect(() => {
    if (!kitId) return;

    const socket = getAppSocket();

    // Handler de réception de télémétrie live
    const handleLiveTelemetry = (event) => {
      if (!event || event.kitId !== kitId) return;

      const liveRecord = event.enriched?.records?.at(-1);
      if (!liveRecord) {
        console.error(`[Socket.io] Événement live invalide pour le kit ${kitId} : aucun relevé enrichi.`);
        return;
      }

      setLiveSnapshot({
        kitId,
        payload: event.enriched,
        latestRecord: liveRecord,
        receivedAt: event.timestamp,
      });
      setLiveStatus({ kitId, active: true });

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
      queryClient.invalidateQueries({ queryKey: ['kit-telemetry-summary', kitId] });

      // Réinitialiser le timer "live"
      resetLiveFlag(liveRecord.interval_seconds);
    };

    // S'abonner au room du kit
    const subscribe = () => {
      socket.emit('subscribe:kit', { kitId });
      console.log(`[Socket.io] Souscription au kit : ${kitId}`);
    };

    const handleDisconnect = () => {
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
      setLiveStatus({ kitId, active: false });
      setLiveSnapshot((snapshot) => snapshot?.kitId === kitId ? null : snapshot);
      queryClient.invalidateQueries({ queryKey: ['telemetry', kitId] });
      queryClient.invalidateQueries({ queryKey: ['kit-telemetry-summary', kitId] });
    };

    socket.on('telemetry:live', handleLiveTelemetry);
    socket.on('connect', subscribe);
    socket.on('disconnect', handleDisconnect);
    if (socket.connected) subscribe();

    return () => {
      // Nettoyage : désabonnement du room
      socket.off('telemetry:live', handleLiveTelemetry);
      socket.off('connect', subscribe);
      socket.off('disconnect', handleDisconnect);
      socket.emit('unsubscribe:kit', { kitId });
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    };
  }, [kitId, queryClient, resetLiveFlag]);

  // ── Calcul des données finales (live prioritaire sur BD) ──────────────────
  const effectiveDocs = livePayload
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

  const latestTelemetry = currentLiveSnapshot?.latestRecord
    ? currentLiveSnapshot.latestRecord
    : telemetryRecords[telemetryRecords.length - 1] ?? null;

  return {
    telemetryDocuments: effectiveDocs,
    telemetryRecords,
    latestTelemetry,
    isLive,
    isLoading,
    lastUpdated: (isLive ? currentLiveSnapshot?.receivedAt : null) ?? (latestTelemetry?.event_time ?? null),
    dataSource: currentLiveSnapshot ? 'live' : (telemetryDocuments.length > 0 ? 'db' : null),
  };
}
