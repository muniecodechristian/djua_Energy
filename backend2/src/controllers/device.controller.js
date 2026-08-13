// src/controllers/device.controller.js
<<<<<<< HEAD
// Handlers HTTP — orchestrent le store DB et le service MQTT.

import * as store from '../store/db.store.js';
=======
// Handlers HTTP — orchestrent store et service sans contenir de logique métier.
// Chaque export est une fonction Express-compatible (req, res).

import * as store from '../store/memory.store.js';
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
import { publishCommand } from '../services/mqtt.service.js';

// ─── Lectures ─────────────────────────────────────────────────────────────────

/** GET /api/devices */
<<<<<<< HEAD
export async function getAllDevices(req, res) {
  try {
    const devices = await store.getAllDevices();
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    console.error('Erreur récupération équipements :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}

/** GET /api/devices/:deviceId */
export async function getDeviceById(req, res) {
  try {
    const device = await store.getDevice(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Équipement non trouvé' });
    }
    res.json({ success: true, data: device });
  } catch (err) {
    console.error('Erreur récupération équipement :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}

/** GET /api/telemetry */
export async function getTelemetry(req, res) {
  try {
    const history = await store.getTelemetryHistory();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    console.error('Erreur récupération télémétrie :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
}

/** GET /api/alerts */
export async function getAlerts(req, res) {
  try {
    const history = await store.getAlertsHistory();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    console.error('Erreur récupération alertes :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur interne' });
  }
=======
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
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 0dd217c31f2f9001975ff823ab57880aa9df9366
