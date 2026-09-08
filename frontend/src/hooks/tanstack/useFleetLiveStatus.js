/**
 * useFleetLiveStatus.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook Singleton — Écoute les événements Socket.io 'fleet:active_kit' broadcastés
 * par le backend à chaque réception de télémétrie ESP32.
 *
 * Logique Senior :
 *   - Maintient une Map<kitId, lastSeenTimestamp> en mémoire
 *   - Un kit est "en ligne" si son dernier signal est <= TTL_MS (défaut: 5 min)
 *   - Le state est mis à jour en temps réel sans polling HTTP
 *   - Nettoyage automatique des kits expirés via un interval
 *
 * Valeur retournée :
 *   { activeKitIds: Set<string>, activeCount: number, isSocketConnected: boolean }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// TTL en ms — un kit est considéré "en ligne" s'il a émis dans les 5 dernières minutes
const TTL_MS = 5 * 60 * 1000;

// ─── Singleton partagé (évite les reconnexions multiples) ─────────────────────
let _socket = null;

function getFleetSocket() {
  if (!_socket) {
    const isLocalHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const serverUrl =
      import.meta.env.VITE_API_URL ??
      (isLocalHost ? 'http://localhost:5000' : 'https://djua-energy-backend.onrender.com');

    _socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 20,
    });

    _socket.on('connect', () => console.log('[Fleet Socket] Connecté :', _socket.id));
    _socket.on('disconnect', (r) => console.warn('[Fleet Socket] Déconnecté :', r));
  }
  return _socket;
}

export function useFleetLiveStatus() {
  // Map kitId → timestamp du dernier signal reçu
  const lastSeenRef = useRef(new Map());
  const [activeKitIds, setActiveKitIds] = useState(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getFleetSocket();

    // Sync de l'état de connexion
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);
    if (socket.connected) setIsSocketConnected(true);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    /**
     * Handler principal : déclenché à chaque signal ESP32
     * Le backend émet : { kitId: string, timestamp: string }
     */
    const handleActiveKit = ({ kitId, timestamp }) => {
      if (!kitId) return;
      lastSeenRef.current.set(kitId, Date.now());

      // Recalcule les kits actifs et met à jour le state
      const now = Date.now();
      const alive = new Set(
        [...lastSeenRef.current.entries()]
          .filter(([, lastSeen]) => now - lastSeen <= TTL_MS)
          .map(([id]) => id)
      );
      setActiveKitIds(alive);
    };

    socket.on('fleet:active_kit', handleActiveKit);

    // ── Nettoyage périodique des kits expirés ────────────────────────────────
    // Toutes les 60s, on retire de la Map les kits silencieux depuis > TTL_MS
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;

      lastSeenRef.current.forEach((lastSeen, kitId) => {
        if (now - lastSeen > TTL_MS) {
          lastSeenRef.current.delete(kitId);
          changed = true;
        }
      });

      if (changed) {
        const alive = new Set(lastSeenRef.current.keys());
        setActiveKitIds(alive);
        console.log(`[Fleet Socket] 🧹 Nettoyage — ${alive.size} kit(s) actifs restants`);
      }
    }, 60_000);

    return () => {
      socket.off('fleet:active_kit', handleActiveKit);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      clearInterval(cleanupInterval);
    };
  }, []);

  return {
    activeKitIds,
    activeCount: activeKitIds.size,
    isSocketConnected,
  };
}
