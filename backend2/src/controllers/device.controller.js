// src/controllers/device.controller.js
// Handlers HTTP — orchestrent le store DB et le service MQTT.

import * as store from '../store/db.store.js';
import { publishCommand } from '../services/mqtt.service.js';

// ─── Lectures ─────────────────────────────────────────────────────────────────

/** GET /api/devices */
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
