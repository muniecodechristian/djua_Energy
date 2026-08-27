import { processAlert, processStatus, processTelemetry } from '../services/iot.service.js';
import { consumeCommands } from '../store/command.store.js';

function getDeviceId(req) {
  return req.params.deviceId || req.body?.deviceId || req.body?.device_id || req.body?.kit_id;
}

export async function receiveTelemetry(req, res) {
  const deviceId = getDeviceId(req);
  if (!deviceId || !req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: 'deviceId et un payload JSON sont requis' });
  }

  try {
    await processTelemetry(deviceId, req.body);
    res.status(202).json({ success: true, message: 'Telemetry accepted', deviceId });
  } catch (error) {
    console.error('[HTTP IoT] Échec télémétrie :', error.message);
    res.status(500).json({ success: false, message: 'Telemetry processing failed' });
  }
}

export async function receiveAlert(req, res) {
  const deviceId = getDeviceId(req);
  if (!deviceId || !req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: 'deviceId et un payload JSON sont requis' });
  }

  try {
    await processAlert(deviceId, req.body);
    res.status(202).json({ success: true, message: 'Alert accepted', deviceId });
  } catch (error) {
    console.error('[HTTP IoT] Échec alerte :', error.message);
    res.status(500).json({ success: false, message: 'Alert processing failed' });
  }
}

export async function receiveStatus(req, res) {
  const deviceId = getDeviceId(req);
  const status = req.body?.status;
  if (!deviceId || !status) {
    return res.status(400).json({ success: false, message: 'deviceId et status sont requis' });
  }

  try {
    await processStatus(deviceId, status);
    res.status(202).json({ success: true, message: 'Status accepted', deviceId });
  } catch (error) {
    console.error('[HTTP IoT] Échec statut :', error.message);
    res.status(500).json({ success: false, message: 'Status processing failed' });
  }
}

export async function getCommands(req, res) {
  try {
    res.json({
      success: true,
      deviceId: req.params.deviceId,
      data: await consumeCommands(req.params.deviceId),
    });
  } catch (error) {
    console.error('[HTTP IoT] Échec récupération commandes :', error.message);
    res.status(500).json({ success: false, message: 'Command retrieval failed' });
  }
}
