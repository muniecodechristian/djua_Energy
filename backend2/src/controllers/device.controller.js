// src/controllers/device.controller.js
// Handlers HTTP — orchestrent le store DB et le service MQTT.

import * as store from '../store/db.store.js';
import { publishCommand } from '../services/mqtt.service.js';
import { enqueueCommand } from '../store/command.store.js';
import Telemetry from '../models/Telemetry.js';
import Quote from '../models/Quote.model.js';
import Kit from '../models/kit.model.js';
import InstallationFolder from '../models/InstallationFolder.model.js';
import { quoteScope } from '../services/quote.service.js';

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

/** GET /api/telemetry/latest?kitIds=KIT-1,KIT-2 */
export async function getLatestKitTelemetry(req, res) {
  const requestedKitIds = [...new Set(String(req.query.kitIds || '')
    .split(',')
    .map(kitId => kitId.trim())
    .filter(Boolean))].slice(0, 50);

  if (requestedKitIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Au moins un kitId est requis' });
  }

  try {
    const role = req.user?.role === 'administration' ? 'admin' : req.user?.role;
    let allowedKitIds = requestedKitIds;
    if (role !== 'admin') {
      const ownedQuoteKitIds = await Quote.distinct('kitId', {
        ...quoteScope(req.user),
        kitId: { $in: requestedKitIds },
      });
      allowedKitIds = role === 'shop_manager'
        ? [...new Set([
          ...ownedQuoteKitIds,
          ...await Kit.distinct('kitId', {
            shopManager: req.user._id,
            kitId: { $in: requestedKitIds },
          }),
        ])]
        : ownedQuoteKitIds;
    }

    if (allowedKitIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const telemetry = await Telemetry.aggregate([
      { $match: { kitId: { $in: allowedKitIds } } },
      { $sort: { kitId: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$kitId',
          createdAt: { $first: '$createdAt' },
          gpsCoordinates: { $first: '$gpsCoordinates' },
          battery: { $first: '$battery' },
          solar: { $first: '$solar' },
          dc_load: { $first: '$dc_load' },
          ac_load: { $first: '$ac_load' },
          environment: { $first: '$environment' },
          meta: { $first: '$meta' },
        },
      },
    ]);

    return res.json({
      success: true,
      data: telemetry.map(({ _id, ...snapshot }) => ({ kitId: _id, ...snapshot })),
    });
  } catch (err) {
    console.error('[Device Controller] Erreur récupération des dernières télémétries :', err);
    return res.status(500).json({ success: false, message: 'Impossible de charger les dernières données IoT' });
  }
}

/** GET /api/telemetry/:kitId/summary */
export async function getKitTelemetrySummary(req, res) {
  const { kitId } = req.params;
  const role = req.user?.role === 'administration' ? 'admin' : req.user?.role;

  try {
    let authorized = role === 'admin';
    if (!authorized && role === 'commercial') {
      authorized = Boolean(await Quote.exists({ ...quoteScope(req.user), kitId }));
    } else if (!authorized && role === 'shop_manager') {
      authorized = Boolean(
        await Quote.exists({ ...quoteScope(req.user), kitId })
        || await Kit.exists({ kitId, shopManager: req.user._id }),
      );
    } else if (!authorized && role === 'technician') {
      authorized = Boolean(await InstallationFolder.exists({
        kitId,
        assignedTechnician: req.user._id,
      }));
    }

    if (!authorized) {
      return res.status(404).json({ success: false, message: 'Kit non trouvé' });
    }

    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [kit, latest, [history = {}]] = await Promise.all([
      Kit.findOne({ kitId }).select('kitId createdAt installationDate gpsCoordinates zone').lean(),
      Telemetry.findOne({ kitId }).sort({ createdAt: -1 }).lean(),
      Telemetry.aggregate([
        { $match: { kitId, createdAt: { $gte: from } } },
        {
          $group: {
            _id: null,
            sampleCount: { $sum: 1 },
            productionSampleCount: {
              $sum: { $cond: [{ $ne: ['$solar.energy_interval_wh', null] }, 1, 0] },
            },
            productionWh: { $sum: { $ifNull: ['$solar.energy_interval_wh', 0] } },
            dcPowerSampleCount: {
              $sum: { $cond: [{ $ne: ['$dc_load.power_w', null] }, 1, 0] },
            },
            averageDcLoadPowerW: { $avg: '$dc_load.power_w' },
            acPowerSampleCount: {
              $sum: { $cond: [{ $ne: ['$ac_load.apparent_power_va', null] }, 1, 0] },
            },
            averageAcLoadApparentPowerVa: { $avg: '$ac_load.apparent_power_va' },
          },
        },
      ]),
    ]);
    const lastSeenTime = latest?.createdAt ? new Date(latest.createdAt).getTime() : 0;

    return res.json({
      success: true,
      data: {
        kit,
        latest,
        communication: {
          isRecent: lastSeenTime > 0 && Date.now() - lastSeenTime < 5 * 60 * 1000,
          lastSeen: latest?.createdAt || null,
        },
        history30d: {
          from,
          to: new Date(),
          sampleCount: history.sampleCount || 0,
          productionKwh: history.productionSampleCount
            ? history.productionWh / 1000
            : null,
          averageDcLoadPowerW: history.dcPowerSampleCount
            ? history.averageDcLoadPowerW
            : null,
          averageAcLoadApparentPowerVa: history.acPowerSampleCount
            ? history.averageAcLoadApparentPowerVa
            : null,
        },
      },
    });
  } catch (err) {
    console.error('[Device Controller] Erreur récupération du résumé de télémétrie :', err);
    return res.status(500).json({ success: false, message: 'Impossible de charger le résumé IoT' });
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
