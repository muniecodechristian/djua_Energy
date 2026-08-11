// src/store/memory.store.js
// Couche de données en mémoire — facilement remplaçable par un ORM/ODM.
// Toutes les mutations passent par ce module : aucun autre fichier ne touche
// directement les structures internes.

import config from '../config/env.config.js';

// ─── État interne (privé au module) ──────────────────────────────────────────

/** @type {Record<string, { status?: any; telemetry?: any; alerts?: any[]; lastSeen?: Date }>} */
const devices = {};

/** @type {Array<{ deviceId: string; timestamp: Date; data: any }>} */
const telemetryHistory = [];

/** @type {Array<{ deviceId: string; timestamp: Date; data: any }>} */
const alertsHistory = [];

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Initialise l'entrée d'un device si elle n'existe pas encore. */
function ensureDevice(deviceId) {
  devices[deviceId] ??= {};
}

// ─── Lectures ─────────────────────────────────────────────────────────────────

export const getAllDevices      = ()           => devices;
export const getDevice         = (deviceId)   => devices[deviceId];
export const getTelemetryHistory = ()         => telemetryHistory;
export const getAlertsHistory  = ()           => alertsHistory;

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Met à jour le statut d'un appareil.
 * @param {string} deviceId
 * @param {string | object} status
 */
export function setDeviceStatus(deviceId, status) {
  ensureDevice(deviceId);
  devices[deviceId].status   = status;
  devices[deviceId].lastSeen = new Date();
}

/**
 * Met à jour la télémétrie d'un appareil et alimente l'historique global.
 * @param {string} deviceId
 * @param {object} payload
 */
export function setDeviceTelemetry(deviceId, payload) {
  ensureDevice(deviceId);
  devices[deviceId].telemetry = payload;
  devices[deviceId].lastSeen  = new Date();

  telemetryHistory.unshift({ deviceId, timestamp: new Date(), data: payload });
  if (telemetryHistory.length > config.history.maxTelemetry) telemetryHistory.pop();
}

/**
 * Ajoute une alerte à un appareil et à l'historique global.
 * @param {string} deviceId
 * @param {object} payload
 */
export function addDeviceAlert(deviceId, payload) {
  ensureDevice(deviceId);
  devices[deviceId].alerts ??= [];
  devices[deviceId].alerts.unshift(payload);
  devices[deviceId].lastSeen = new Date();

  alertsHistory.unshift({ deviceId, timestamp: new Date(), data: payload });
  if (alertsHistory.length > config.history.maxAlerts) alertsHistory.pop();
}
