// src/controllers/device.controller.js
// Handlers HTTP — orchestrent le store DB et le service MQTT.

import * as store from '../store/db.store.js';
import { publishCommand } from '../services/mqtt.service.js';
import { enqueueCommand } from '../store/command.store.js';
import Telemetry from '../models/Telemetry.js';

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

/** GET /api/telemetry/:kitId — Données brutes IoT depuis la collection Telemetry */
export async function getKitTelemetry(req, res) {
  const { kitId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
  const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const skip  = (page - 1) * limit;
  const sort  = req.query.sort === 'asc' ? 1 : -1;

  if (!kitId) {
    return res.status(400).json({ success: false, message: 'kitId est requis' });
  }

  try {
    const [telemetries, total] = await Promise.all([
      Telemetry.find({ kitId })
        .sort({ createdAt: sort })
        .skip(skip)
        .limit(limit)
        .lean(),
      Telemetry.countDocuments({ kitId }),
    ]);

    res.json({
      success: true,
      count: telemetries.length,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: telemetries,
    });
  } catch (err) {
    console.error('[Device Controller] Erreur récupération télémétrie brute :', err);
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
    console.warn('MQTT indisponible, commande mise en file HTTP :', err.message);
    await enqueueCommand(deviceId, command);
    res.status(202).json({ success: true, message: `Commande '${command}' mise en attente pour ${deviceId}` });
  }
}
