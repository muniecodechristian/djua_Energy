import * as memoryStore from '../store/memory.store.js';
import * as dbStore from '../store/db.store.js';
import { enrichTelemetry, normalizeTelemetryPayload } from './telemetryEnricher.service.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';

export async function processStatus(deviceId, status) {
  console.log('[HTTP IoT] Statut reçu:', {
    deviceId,
    status,
    receivedAt: new Date().toISOString(),
  });
  memoryStore.setDeviceStatus(deviceId, status);
  await dbStore.setDeviceStatus(deviceId, status);
}

export async function processTelemetry(deviceId, payload) {
  const cleanPayload = normalizeTelemetryPayload(payload);
  console.log('[HTTP IoT] Télémétrie reçue:', {
    deviceId,
    data: cleanPayload,
    receivedAt: new Date().toISOString(),
  });
  const enriched = await enrichTelemetry({
    ...cleanPayload,
    deviceId: cleanPayload.device_id || deviceId,
    kitId: cleanPayload.kit_id || deviceId,
  });

  memoryStore.setDeviceTelemetry(deviceId, enriched);
  await dbStore.setDeviceTelemetry(deviceId, cleanPayload);
  await EnrichedTelemetry.create(enriched);

  return enriched;
}

export async function processAlert(deviceId, payload) {
  console.log('[HTTP IoT] Alerte reçue:', {
    deviceId,
    data: payload,
    receivedAt: new Date().toISOString(),
  });
  memoryStore.addDeviceAlert(deviceId, payload);
  await dbStore.addDeviceAlert(deviceId, payload);

}
