// src/services/telemetryEnricher.service.js
import Kit from '../models/kit.model.js';
import Client from '../models/client.model.js';
import Payment from '../models/payment.model.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';

export const RETIRED_TELEMETRY_FIELDS = new Set([
  'serial_number', 'serialNumber',
  'battery_temperature_c', 'battery_age_months', 'distance_from_installation_m',
  'movement_detected', 'movement_duration_seconds', 'movement_event_count',
  'tamper_detected', 'enclosure_opened', 'connection_status', 'connectivity_type',
  'network_quality', 'connectivity_gap_seconds', 'security_risk_zone',
  'panel_temperature_c', 'solar_irradiance_w_m2', 'gps_accuracy_m',
  'impact_detected', 'identity_mismatch_detected', 'short_circuit_detected',
  'reset_count', 'sensor_failure_detected', 'device_error_code', 'usage_profile',
  'season', 'day_period', 'speed_mps', 'network_operator',
  'batteryTemperature', 'distanceInstallationM', 'movement', 'tamper',
  'connection', 'networkQuality', 'connectivityGapSeconds', 'riskZone',
  'panelTemperature', 'irradiance', 'gpsAccuracy', 'movementDuration',
  'movementCount', 'impact', 'identityMismatch', 'shortCircuit',
  'batteryAge', 'resetCount', 'sensorFailure', 'deviceErrorCode', 'usageProfile',
]);

export function stripRetiredTelemetryFields(record) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) => !RETIRED_TELEMETRY_FIELDS.has(key))
  );
}

export function normalizeTelemetryPayload(payload = {}) {
  const solar = payload.solar || {};
  const battery = payload.battery || {};
  const dcLoad = payload.dc_load || {};
  const acLoad = payload.ac_load || {};

  return stripRetiredTelemetryFields({
    ...payload,
    kit_id: payload.kit_id || payload.kitId,
    device_id: payload.device_id || payload.deviceId || payload.kit_id || payload.kitId,
    event_time: payload.event_time || payload.timestamp,
    interval_seconds: payload.interval_seconds,
    solar_voltage_v: payload.solar_voltage_v ?? solar.voltage_v,
    solar_current_a: payload.solar_current_a ?? solar.current_a,
    solar_power_w: payload.solar_power_w ?? solar.power_w,
    energy_generated_wh: payload.energy_generated_wh ?? solar.energy_interval_wh,
    battery_voltage_v: payload.battery_voltage_v ?? battery.voltage_v,
    battery_current_a: payload.battery_current_a ?? battery.current_a,
    battery_power_w: payload.battery_power_w ?? battery.power_w,
    load_voltage_v: payload.load_voltage_v ?? dcLoad.voltage_v,
    load_current_a: payload.load_current_a ?? dcLoad.current_a,
    load_power_w: payload.load_power_w ?? dcLoad.power_w,
    energy_consumed_wh: payload.energy_consumed_wh ?? dcLoad.energy_interval_wh,
    ac_load_voltage_v: acLoad.voltage_v,
    ac_load_current_a: acLoad.current_a,
    ac_apparent_power_va: acLoad.apparent_power_va,
    ac_energy_interval_vah: acLoad.energy_interval_vah,
  });
}

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
/**
 * Construit un objet "record" de télémétrie enrichie (les 63 champs plats)
 * à partir du payload IoT brut et des données contextuelles.
 */
function buildRecord(iotPayload, { kitId, deviceId, kitInfo }) {
  const deviceTemp = iotPayload.device_temperature_c ?? 38;
  const ambientTemp = iotPayload.device_temperature_c
    ? Math.round(iotPayload.device_temperature_c - 4)
    : 34;
  return {
    message_id: iotPayload.message_id || `msg-${Date.now()}`,
    schema_version: String(iotPayload.schema_version || '1.0'),
    message_type: iotPayload.message_type || 'telemetry',
    device_id: deviceId,
    kit_id: kitId,
    event_time: String(iotPayload.event_time || Math.floor(Date.now() / 1000)),
    sequence_number: Number(iotPayload.sequence_number ?? 1),
    battery_voltage_v: Number(iotPayload.battery_voltage_v ?? 0.0),
    battery_current_a: Number(iotPayload.battery_current_a ?? 0.0),
    battery_power_w: Number(iotPayload.battery_power_w ?? (iotPayload.battery_current_a && iotPayload.battery_voltage_v ? (iotPayload.battery_current_a * iotPayload.battery_voltage_v).toFixed(2) : 0.0)),
    state_of_charge_pct: Number(iotPayload.state_of_charge_pct ?? 100),
    state_of_health_pct: Number(iotPayload.state_of_health_pct ?? 100),
    battery_error_code: iotPayload.battery_error_code || 'NONE',
    charge_duration_seconds: Number(iotPayload.charge_duration_seconds ?? 0),
    discharge_duration_seconds: Number(iotPayload.discharge_duration_seconds ?? 0),
    solar_voltage_v: Number(iotPayload.solar_voltage_v ?? 0.0),
    solar_current_a: Number(iotPayload.solar_current_a ?? 0.0),
    solar_power_w: Number(iotPayload.solar_power_w ?? 0.0),
    energy_generated_wh: Number(iotPayload.energy_generated_wh ?? 0),
    solar_error_code: iotPayload.solar_error_code || 'NONE',
    load_voltage_v: Number(iotPayload.load_voltage_v ?? 0.0),
    load_current_a: Number(iotPayload.load_current_a ?? 0.0),
    load_power_w: Number(iotPayload.load_power_w ?? 0.0),
    energy_consumed_wh: Number(iotPayload.energy_consumed_wh ?? 0),
    overload_detected: iotPayload.overload_detected ?? false,
    abnormal_consumption_detected: iotPayload.abnormal_consumption_detected ?? iotPayload.overload_detected ?? false,
    latitude: Number(iotPayload.latitude ?? 0.0),
    longitude: Number(iotPayload.longitude ?? 0.0),
    device_temperature_c: Number(deviceTemp),
    region: iotPayload.region || kitInfo?.region || 'urban_periurban',
    ambient_temperature_c: Number(iotPayload.ambient_temperature_c ?? ambientTemp),
    humidity_pct: Number(iotPayload.humidity_pct ?? 62),
    installation_type: iotPayload.installation_type || kitInfo?.installationType || 'household_rooftop',
  };
}

/**
 * Enrichit la télémétrie brute de l'ESP32 vers le nouveau schéma imbriqué
 * attendu par le modèle IA.
 *
 * @param {object} iotPayload - Payload brut MQTT/HTTP envoyé par l'ESP32
 * @returns {Promise<object>} Payload enrichi au format complet attendu par le modèle IA
 */
export async function enrichTelemetry(iotPayload) {
  const normalizedPayload = normalizeTelemetryPayload(iotPayload);
  const kitId = normalizedPayload.kit_id || normalizedPayload.kitId || 'unknown-kit';
  const deviceId = normalizedPayload.device_id || normalizedPayload.deviceId || kitId;

  // ── 1. Données contextuelles depuis MongoDB ──────────────────────────────
  const [kitInfo, clientInfo] = await Promise.all([
    Kit.findOne({ kitId }).lean().catch(() => null),
    Client.findOne({ kitId }).lean().catch(() => null),
  ]);

  const clientPhone = kitInfo?.clientPhone || clientInfo?.clientPhone;

  const context = { kitId, deviceId, kitInfo };

  // ── 4. Construire le record actuel ───────────────────────────────────────
  const currentRecord = buildRecord(normalizedPayload, context);

  // ── 5. Récupérer la télémétrie précédente depuis MongoDB ─────────────────
  const previousDoc = await EnrichedTelemetry.findOne(
    { $or: [{ 'records.0.kit_id': kitId }, { 'identity.kit_id': kitId }] },
    null,
    { sort: { createdAt: -1 } }
  ).lean().catch(() => null);

  // Extraire le dernier record si disponible
  const previousRecord = previousDoc?.records?.length
    ? stripRetiredTelemetryFields(previousDoc.records[previousDoc.records.length - 1])
    : null;

  const records = previousRecord
    ? [previousRecord, currentRecord]
    : [currentRecord];

  // ── 6. Paiements depuis MongoDB ──────────────────────────────────────────
  let payments = [];
  if (clientPhone) {
    const rawPayments = await Payment.find({ clientPhone }).sort({ date: -1 }).limit(20).lean().catch(() => []);
    payments = rawPayments.map(p => ({
      payment_id: p.paymentId,
      client_id: `client-${kitId}`,
      contract_id: `contract-${kitId}`,
      due_date: p.date ? new Date(p.date).toISOString() : null,
      paid_at: p.date ? new Date(p.date).toISOString() : null,
      amount_due: p.amountUSD ?? kitInfo?.periodicAmountUSD ?? 0,
      amount_paid: p.amountUSD ?? 0,
      status: p.status || 'unknown',
      method: 'orange_money',
    }));
  }

  // ── 7. Résolution de l'identité ──────────────────────────────────────────
  const identityResolved = !!kitInfo;
  const missingFeatures = [];
  if (!kitInfo) missingFeatures.push('kit_info');
  if (!clientInfo) missingFeatures.push('client_info');
  if (!clientPhone) missingFeatures.push('client_phone');
  if (payments.length === 0) missingFeatures.push('payment_history');

  // ── 8. Assemblage du payload final ───────────────────────────────────────
  return {
    schema_version: '1.0',
    request_id: `mqtt-${deviceId}-${Date.now()}`,
    as_of: new Date().toISOString(),

    identity: {
      client_id: `client-${kitId}`,
      kit_id: kitId,
      device_id: deviceId,
      installation_id: `installation-${kitId}`,
      contract_id: `contract-${kitId}`,
      assignment_id: `assignment-${kitId}`,
      resolution_status: identityResolved ? 'resolved' : 'partial',
    },

    customer: {
      customer_segment: 'residential',
      active_contracts: kitInfo?.status === 'active' ? 1 : 0,
    },

    contract: {
      contract_id: `contract-${kitId}`,
      status: kitInfo?.status || 'unknown',
      periodic_amount_usd: kitInfo?.periodicAmountUSD ?? 0,
    },

    assignment: {
      assignment_id: `assignment-${kitId}`,
      client_id: `client-${kitId}`,
      kit_id: kitId,
      device_id: deviceId,
      status: kitInfo?.status || 'unknown',
    },

    payments,

    records,

    data_quality: {
      identity_resolved: identityResolved,
      missing_features: missingFeatures,
      warnings: [],
    },
  };
}
