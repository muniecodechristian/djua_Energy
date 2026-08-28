// src/store/db.store.js
// Couche de données persistante (MongoDB / Mongoose).
// Toutes les mutations et lectures passent par ici pour interagir avec la vraie BDD.

import AlertModel from '../models/Alert.model.js';
import Kit from '../models/kit.model.js';
import Telemetry from '../models/Telemetry.js';




// ─── Lectures ─────────────────────────────────────────────────────────────────

/** Récupère tous les équipements enregistrés en BDD */
export async function getAllDevices() {
  const kits = await Kit.find({}).lean();
  return kits;
}

/** Récupère un équipement spécifique avec ses dernières données en BDD */
export async function getDevice(deviceId) {
  const kit = await Kit.findOne({ kitId: deviceId }).lean();
  if (!kit) return null;

  // Récupère la dernière télémétrie et les alertes actives pour enrichir l'objet
  const latestTelemetry = await Telemetry.findOne({ kitId: deviceId }).sort({ createdAt: -1 }).lean();
  const activeAlerts = await AlertModel.find({ kitId: deviceId, status: 'active' }).lean();

  return {
    ...kit,
    telemetry: latestTelemetry ? latestTelemetry.battery : null,
    alerts: activeAlerts,
  };
}

/** Récupère l'historique global de la télémétrie (limité aux 100 derniers) */
export async function getTelemetryHistory() {
  return await Telemetry.find({}).sort({ createdAt: -1 }).limit(100).lean();
}

/** Récupère l'historique global des alertes (limité aux 100 dernières) */
export async function getAlertsHistory() {
  return await AlertModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Met à jour ou crée le statut d'un appareil en BDD.
 */
export async function setDeviceStatus(deviceId, status) {
  await Kit.findOneAndUpdate(
    { kitId: deviceId },
    { $set: { status, updatedAt: new Date() } },
    { upsert: true, new: true }
  );
}

/**
 * Enregistre une nouvelle télémétrie en BDD et met à jour la position GPS du kit.
 */
export async function setDeviceTelemetry(deviceId, payload) {
  // 1. Enregistre le log brut dans la collection Telemetry
  await Telemetry.create({
    kitId: deviceId,
    gpsCoordinates: payload.gpsCoordinates || {},
    metrics: payload.metrics || payload,
    extraData: payload.extraData || {},
  });

  // 2. Met à jour la dernière position connue sur le document principal du Kit
  const updateData = { updatedAt: new Date() };
  if (payload.gpsCoordinates) {
    updateData.gpsCoordinates = payload.gpsCoordinates;
  }

  await Kit.findOneAndUpdate(
    { kitId: deviceId },
    { $set: updateData },
    { upsert: true }
  );
}

/**
 * Enregistre une alerte persistante en BDD.
 */
export async function addDeviceAlert(deviceId, payload) {
  await AlertModel.create({
    kitId: deviceId,
    source: payload.source || 'iot_esp32',
    type: payload.type || 'unknown_alert',
    severity: payload.severity || 'medium',
    label: payload.label || 'Alerte appareil',
    description: payload.description || 'Signal émis par le matériel',
    metadata: payload.metadata || payload,
    status: 'active',
  });
}