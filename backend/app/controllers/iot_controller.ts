import type { HttpContext } from '@adonisjs/core/http';
import { Kit, Telemetry, Alert, EnrichedTelemetry } from '../models/index.js';
import { emitLiveTelemetry } from '../services/socket_service.js';

const clean = (p: any) => p || {};

export async function processTelemetry(id: string, p: any) {
  const x = clean(p);
  const kitId = x.kit_id || x.kitId || id;
  const deviceId = x.device_id || id;

  // 1. Enregistrement des données brutes de télémétrie
  const doc = await Telemetry.create({
    kitId,
    deviceId,
    gpsCoordinates: { latitude: x.latitude ?? null, longitude: x.longitude ?? null },
    battery: {
      voltage_v: x.battery_voltage_v ?? null,
      current_a: x.battery_current_a ?? null,
      power_w: x.battery_power_w ?? null,
      state_of_charge_pct: x.state_of_charge_pct ?? null,
      state_of_health_pct: x.state_of_health_pct ?? null,
      error_code: x.battery_error_code ?? 'NONE',
    },
    solar: x.solar || {},
    dc_load: x.dc_load || {},
    ac_load: x.ac_load || {},
    environment: x.environment || {},
    meta: x.meta || {},
    extraData: x,
  });

  // 2. Logique Senior d'auto-activation du Kit
  // Si le kit est détecté comme inactif ou hors-ligne, mais qu'il envoie de la data,
  // nous corrigeons son statut instantanément pour refléter sa connectivité réelle.
  const existingKit = await Kit.findOne({ kitId });
  const updatePayload: any = {
    gpsCoordinates: doc.gpsCoordinates,
    updatedAt: new Date(),
  };

  // Les statuts considérés comme "déconnectés" mais qui doivent repasser actifs s'ils émettent
  const inactiveStatuses = ['inactive', 'offline', 'disconnected'];

  if (existingKit && inactiveStatuses.includes(existingKit.status)) {
    updatePayload.status = 'active';
    console.log(`[IoT Core] 🟢 Auto-activation du Kit ${kitId} suite à la réception de télémétrie ESP32.`);
  }

  // Si le kit n'existe pas, il sera créé par upsert avec un statut actif par défaut
  if (!existingKit) {
    updatePayload.status = 'active';
  }

  await Kit.findOneAndUpdate({ kitId }, { $set: updatePayload }, { upsert: true });

  // 3. Création de la télémétrie enrichie pour le ML/Dashboard
  const enriched = await EnrichedTelemetry.create({
    ...x,
    identity: { kit_id: kitId, device_id: id },
    records: [x],
  });

  // 4. Émission en temps réel via WebSockets
  emitLiveTelemetry(kitId, enriched.toObject(), doc.toObject());
  return x;
}

export async function processAlert(id: string, p: any) {
  return Alert.create({
    kitId: id,
    source: p.source || 'iot_esp32',
    type: p.type || 'unknown_alert',
    severity: p.severity || 'medium',
    label: p.label || 'Alerte appareil',
    description: p.description || 'Signal émis par le matériel',
    metadata: p,
    status: 'active',
  });
}

export async function processStatus(id: string, status: any) {
  return Kit.findOneAndUpdate({ kitId: id }, { $set: { status, updatedAt: new Date() } }, { upsert: true });
}

export async function receiveTelemetry({ params, request, response }: HttpContext) {
  const id = params.deviceId || request.input('deviceId') || request.input('device_id') || request.input('kit_id');
  if (!id) return response.badRequest({ success: false, message: 'deviceId et un payload JSON sont requis' });
  await processTelemetry(id, request.body());
  return response.accepted({ success: true, message: 'Telemetry accepted', deviceId: id });
}

export async function receiveAlert({ params, request, response }: HttpContext) {
  const id = params.deviceId || request.input('deviceId');
  if (!id) return response.badRequest({ success: false, message: 'deviceId et un payload JSON sont requis' });
  await processAlert(id, request.body());
  return response.accepted({ success: true, message: 'Alert accepted', deviceId: id });
}

export async function receiveStatus({ params, request, response }: HttpContext) {
  const id = params.deviceId || request.input('deviceId');
  const status = request.input('status');
  if (!id || !status) return response.badRequest({ success: false, message: 'deviceId et status sont requis' });
  await processStatus(id, status);
  return response.accepted({ success: true, message: 'Status accepted', deviceId: id });
}

const queue: Record<string, any[]> = {};
export async function commands({ params, response }: HttpContext) {
  const data = queue[params.deviceId] || [];
  queue[params.deviceId] = [];
  return response.ok({ success: true, deviceId: params.deviceId, data });
}
