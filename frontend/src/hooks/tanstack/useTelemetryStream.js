// src/hooks/tanstack/useTelemetryStream.js
// Hook composé : combine télémétrie + devices avec un refresh rapide (10s).
// Expose des données prêtes à l'emploi pour le TelemetryDashboard.

import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios.js';

// ─── 1. Historique global de télémétrie ───────────────────────────────────────
/**
 * Récupère l'historique de télémétrie depuis GET /api/telemetry.
 * Refresh toutes les 10 secondes pour un affichage quasi-temps-réel.
 */
export const useTelemetryStream = () => {
  return useQuery({
    queryKey: ['telemetry-stream'],
    queryFn: async () => {
      const response = await api.get('/api/telemetry');
      if (response.data?.success) {
        return response.data.data; // Array<{ deviceId, timestamp, data: TelemetryPayload }>
      }
      return [];
    },
    staleTime: 1000 * 10,          // 10 secondes de fraîcheur
    refetchInterval: 1000 * 10,    // Re-poll toutes les 10 secondes
    retry: 2,
  });
};

// ─── 2. Snapshot temps réel de tous les devices ───────────────────────────────
/**
 * Récupère tous les devices IoT depuis GET /api/devices.
 * Refresh toutes les 10 secondes.
 */
export const useDevicesStream = () => {
  return useQuery({
    queryKey: ['devices-stream'],
    queryFn: async () => {
      const response = await api.get('/api/devices');
      if (response.data?.success) {
        return response.data.data; // Record<deviceId, { status, telemetry, alerts, lastSeen }>
      }
      return {};
    },
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 10,
    retry: 2,
  });
};

// ─── 3. Hook combiné : toutes les données télémétrie pour le dashboard ────────
/**
 * Agrège télémétrie historique + état live des devices.
 * @returns {{
 *   telemetryHistory: Array,
 *   devicesMap: Record<string, object>,
 *   latestByDevice: Record<string, object>,
 *   stats: object,
 *   isLoading: boolean,
 *   isError: boolean,
 *   refetch: () => void,
 *   lastUpdated: Date | null
 * }}
 */
export const useTelemetryDashboard = () => {
  const {
    data: telemetryHistory = [],
    isLoading: telLoading,
    isError: telError,
    refetch: refetchTel,
    dataUpdatedAt: telUpdatedAt,
  } = useTelemetryStream();

  const {
    data: devicesMap = {},
    isLoading: devLoading,
    isError: devError,
    refetch: refetchDev,
  } = useDevicesStream();

  // ── Dernière télémétrie connue par device ────────────────────────────────────
  const latestByDevice = {};
  for (const entry of telemetryHistory) {
    if (!latestByDevice[entry.deviceId]) {
      latestByDevice[entry.deviceId] = entry; // Le premier = le plus récent (LIFO)
    }
  }

  // ── Statistiques agrégées (Professionnelles) ──────────────────────────────────
  const onlineDevices = Object.values(devicesMap).filter((d) => d.status === 'online').length;
  const totalDevices  = Object.keys(devicesMap).length;

  // Calculer les moyennes sur le dernier signal connu de chaque kit actif (principe Pro)
  const activePayloads = Object.values(latestByDevice).map(e => e.data).filter(Boolean);
  const withVoltage   = activePayloads.filter((d) => d.batteryVoltage != null);
  const withSOC       = activePayloads.filter((d) => d.batterySOC != null);
  const withPower     = activePayloads.filter((d) => d.panelPower != null);

  const avgBatteryVoltage = withVoltage.length
    ? (withVoltage.reduce((s, d) => s + d.batteryVoltage, 0) / withVoltage.length).toFixed(2)
    : null;

  const avgBatterySOC = withSOC.length
    ? Math.round(withSOC.reduce((s, d) => s + d.batterySOC, 0) / withSOC.length)
    : null;

  const avgPanelPower = withPower.length
    ? (withPower.reduce((s, d) => s + d.panelPower, 0) / withPower.length).toFixed(2)
    : null;

  const lastTimestamp = telemetryHistory[0]?.timestamp
    ? new Date(telemetryHistory[0].timestamp)
    : null;

  const stats = {
    onlineDevices,
    totalDevices,
    avgBatteryVoltage,
    avgBatterySOC,
    avgPanelPower,
    totalEntries: telemetryHistory.length,
    lastTimestamp,
  };

  const refetch = () => {
    refetchTel();
    refetchDev();
  };

  return {
    telemetryHistory,
    devicesMap,
    latestByDevice,
    stats,
    isLoading: telLoading || devLoading,
    isError: telError && devError,
    refetch,
    lastUpdated: telUpdatedAt ? new Date(telUpdatedAt) : null,
  };
};
