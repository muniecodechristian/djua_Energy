// src/services/iot.service.js
// Traite les messages IoT reçus (HTTP ou MQTT) :
//   1. Normalise le payload brut
//   2. Enrichit avec le contexte BDD (kit, client, paiements)
//   3. Sauvegarde en BDD (Telemetry brute + EnrichedTelemetry ML)
//   4. Met à jour le store mémoire + store DB
//   5. Émet un événement Socket.io 'telemetry:live' pour le frontend en temps réel

import * as memoryStore from '../store/memory.store.js';
import * as dbStore from '../store/db.store.js';
import { enrichTelemetry, normalizeTelemetryPayload } from './telemetryEnricher.service.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';
import Telemetry from '../models/Telemetry.js';
import { emitLiveTelemetry } from './socket.service.js';

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
  const kitId = cleanPayload.kit_id || cleanPayload.kitId || deviceId;

  console.log('[HTTP IoT] Télémétrie reçue:', {
    deviceId,
    kitId,
    data: cleanPayload,
    receivedAt: new Date().toISOString(),
  });

  // ── 1. Enrichissement du payload pour le ML/IA ────────────────────────────
  const enriched = await enrichTelemetry({
    ...cleanPayload,
    deviceId: cleanPayload.device_id || deviceId,
    kitId,
  });

  // ── 2. Sauvegarde de la télémétrie brute en BDD (collection Telemetry) ────
  // Construit un document Telemetry structuré depuis le payload normalisé
  const rawTelemetryDoc = await Telemetry.create({
    kitId,
    deviceId: cleanPayload.device_id || deviceId,
    gpsCoordinates: {
      latitude:  cleanPayload.latitude  ?? null,
      longitude: cleanPayload.longitude ?? null,
    },
    battery: {
      voltage_v:           cleanPayload.battery_voltage_v    ?? null,
      current_a:           cleanPayload.battery_current_a    ?? null,
      power_w:             cleanPayload.battery_power_w      ?? null,
      state_of_charge_pct: cleanPayload.state_of_charge_pct  ?? null,
      state_of_health_pct: cleanPayload.state_of_health_pct  ?? null,
      error_code:          cleanPayload.battery_error_code   ?? 'NONE',
    },
    solar: {
      voltage_v:          cleanPayload.solar_voltage_v    ?? null,
      current_a:          cleanPayload.solar_current_a    ?? null,
      power_w:            cleanPayload.solar_power_w      ?? null,
      energy_interval_wh: cleanPayload.energy_generated_wh ?? null,
      error_code:         cleanPayload.solar_error_code   ?? 'NONE',
    },
    dc_load: {
      voltage_v:          cleanPayload.load_voltage_v     ?? null,
      current_a:          cleanPayload.load_current_a     ?? null,
      power_w:            cleanPayload.load_power_w       ?? null,
      energy_interval_wh: cleanPayload.energy_consumed_wh ?? null,
      overload_detected:  cleanPayload.overload_detected  ?? false,
    },
    ac_load: {
      voltage_v:           cleanPayload.ac_load_voltage_v       ?? null,
      current_a:           cleanPayload.ac_load_current_a       ?? null,
      apparent_power_va:   cleanPayload.ac_apparent_power_va    ?? null,
      energy_interval_vah: cleanPayload.ac_energy_interval_vah  ?? null,
    },
    environment: {
      device_temperature_c:  cleanPayload.device_temperature_c  ?? null,
      ambient_temperature_c: cleanPayload.ambient_temperature_c ?? null,
      humidity_pct:          cleanPayload.humidity_pct          ?? null,
      signal_strength_dbm:   cleanPayload.signal_strength_dbm   ?? null,
    },
    meta: {
      message_id:       cleanPayload.message_id      ?? null,
      schema_version:   cleanPayload.schema_version  ?? '1.0',
      message_type:     cleanPayload.message_type    ?? 'telemetry',
      event_time:       cleanPayload.event_time      ?? null,
      sequence_number:  cleanPayload.sequence_number ?? 1,
      interval_seconds: cleanPayload.interval_seconds ?? null,
    },
    extraData: {},
  });

  // ── 3. Sauvegarde des données enrichies (collection EnrichedTelemetry ML) ─
  await EnrichedTelemetry.create(enriched);

  // ── 4. Mise à jour des stores (mémoire + BDD kit) ─────────────────────────
  memoryStore.setDeviceTelemetry(deviceId, enriched);
  await dbStore.setDeviceTelemetry(deviceId, cleanPayload);

  // ── 5. Émission Socket.io temps réel → room kit:{kitId} ───────────────────
  // Le frontend reçoit immédiatement les données si abonné à ce kit
  try {
    emitLiveTelemetry(kitId, enriched, rawTelemetryDoc.toObject());
  } catch (socketErr) {
    // Non bloquant : le Socket.io peut ne pas être encore initialisé au démarrage
    console.warn('[IoT Service] Impossible d\'émettre via Socket.io :', socketErr.message);
  }

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
