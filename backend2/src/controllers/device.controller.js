// src/controllers/device.controller.js
// Handlers HTTP — orchestrent store et service sans contenir de logique métier.
// Chaque export est une fonction Express-compatible (req, res).

import * as store from '../store/memory.store.js';
import { publishCommand } from '../services/mqtt.service.js';

// ─── Lectures ─────────────────────────────────────────────────────────────────

/** GET /api/devices */
export function getAllDevices(req, res) {
  const devices = store.getAllDevices();
  res.json({ success: true, count: Object.keys(devices).length, data: devices });
}

/** GET /api/devices/:deviceId */
export function getDeviceById(req, res) {
  const device = store.getDevice(req.params.deviceId);
  if (!device) {
    return res.status(404).json({ success: false, message: 'Équipement non trouvé' });
  }
  res.json({ success: true, data: device });
}

/** GET /api/telemetry */
export function getTelemetry(req, res) {
  const history = store.getTelemetryHistory();
  res.json({ success: true, count: history.length, data: history });
}

/** GET /api/alerts */
export function getAlerts(req, res) {
  const history = store.getAlertsHistory();
  res.json({ success: true, count: history.length, data: history });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** POST /api/commands  — body: { deviceId, command } */
export async function sendCommand(req, res) {
  const { deviceId, command } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({ success: false, message: 'deviceId et command sont requis' });
  }

  try {
    await publishCommand(deviceId, command);
    res.json({ success: true, message: `Commande '${command}' envoyée à ${deviceId}` });
  } catch (err) {
    console.error('Échec envoi commande :', err.message);
    res.status(500).json({ success: false, message: "Erreur broker MQTT lors de l'envoi" });
  }
}
