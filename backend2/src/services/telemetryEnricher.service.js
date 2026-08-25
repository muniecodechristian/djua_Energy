// src/services/telemetryEnricher.service.js
import Kit from '../models/kit.model.js';
import Client from '../models/client.model.js';
import Payment from '../models/payment.model.js';
import EnrichedTelemetry from '../models/EnrichedTelemetry.js';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Construit un objet "record" de télémétrie enrichie (les 63 champs plats)
 * à partir du payload IoT brut et des données contextuelles.
 */
function buildRecord(iotPayload, { kitId, deviceId, kitInfo, distance, geofenceStatus, batteryAge, stateOfHealth }) {
  const deviceTemp = iotPayload.device_temperature_c ?? 38;
  const ambientTemp = iotPayload.device_temperature_c
    ? Math.round(iotPayload.device_temperature_c - 4)
    : 34;
  const batteryTemp = iotPayload.device_temperature_c != null
    ? Number((iotPayload.device_temperature_c + 5.5).toFixed(1))
    : 43.5;

  const currentHour = new Date().getHours();
  const dayPeriod = (currentHour >= 6 && currentHour < 18) ? 'day' : 'night';
  const currentMonth = new Date().getMonth();
  const season = (currentMonth >= 4 && currentMonth <= 9) ? 'wet' : 'dry';

  return {
    message_id: iotPayload.message_id || `msg-${Date.now()}`,
    schema_version: String(iotPayload.schema_version || '1.0'),
    message_type: iotPayload.message_type || 'telemetry',
    device_id: deviceId,
    kit_id: kitId,
    serial_number: iotPayload.serial_number || 'SN-UNKNOWN',
    event_time: String(iotPayload.event_time || Math.floor(Date.now() / 1000)),
    sequence_number: Number(iotPayload.sequence_number ?? 1),
    battery_voltage_v: Number(iotPayload.battery_voltage_v ?? 0.0),
    battery_current_a: Number(iotPayload.battery_current_a ?? 0.0),
    battery_power_w: Number(iotPayload.battery_power_w ?? (iotPayload.battery_current_a && iotPayload.battery_voltage_v ? (iotPayload.battery_current_a * iotPayload.battery_voltage_v).toFixed(2) : 0.0)),
    battery_temperature_c: batteryTemp,
    state_of_charge_pct: Number(iotPayload.state_of_charge_pct ?? 100),
    state_of_health_pct: Number(iotPayload.state_of_health_pct ?? stateOfHealth),
    battery_age_months: Number(batteryAge),
    battery_error_code: iotPayload.battery_error_code || 'NONE',
    charge_duration_seconds: Number(iotPayload.charge_duration_seconds ?? 0),
    discharge_duration_seconds: Number(iotPayload.discharge_duration_seconds ?? 0),
    solar_voltage_v: Number(iotPayload.solar_voltage_v ?? 0.0),
    solar_current_a: Number(iotPayload.solar_current_a ?? 0.0),
    solar_power_w: Number(iotPayload.solar_power_w ?? 0.0),
    energy_generated_wh: Number(iotPayload.energy_generated_wh ?? 0),
    panel_temperature_c: Number(iotPayload.panel_temperature_c ?? 40),
    solar_irradiance_w_m2: Number(iotPayload.solar_irradiance_w_m2 ?? 0),
    solar_error_code: iotPayload.solar_error_code || 'NONE',
    load_voltage_v: Number(iotPayload.load_voltage_v ?? 0.0),
    load_current_a: Number(iotPayload.load_current_a ?? 0.0),
    load_power_w: Number(iotPayload.load_power_w ?? 0.0),
    energy_consumed_wh: Number(iotPayload.energy_consumed_wh ?? 0),
    overload_detected: iotPayload.overload_detected ?? false,
    short_circuit_detected: iotPayload.short_circuit_detected ?? false,
    abnormal_consumption_detected: iotPayload.abnormal_consumption_detected ?? iotPayload.overload_detected ?? false,
    latitude: Number(iotPayload.latitude ?? 0.0),
    longitude: Number(iotPayload.longitude ?? 0.0),
    gps_accuracy_m: Number(iotPayload.gps_accuracy_m ?? 10),
    distance_from_installation_m: Number(distance),
    geofence_status: geofenceStatus,
    speed_mps: Number(iotPayload.speed_mps ?? 0),
    movement_detected: iotPayload.movement_detected ?? false,
    movement_duration_seconds: Number(iotPayload.movement_duration_seconds ?? 0),
    movement_event_count: Number(iotPayload.movement_event_count ?? 0),
    tamper_detected: iotPayload.tamper_detected ?? false,
    enclosure_opened: iotPayload.enclosure_opened ?? false,
    impact_detected: iotPayload.impact_detected ?? false,
    identity_mismatch_detected: iotPayload.serial_number && kitInfo?.serialNumber
      ? (iotPayload.serial_number !== kitInfo.serialNumber)
      : false,
    connectivity_type: iotPayload.connectivity_type || 'lte',
    connection_status: iotPayload.connection_status || 'connected',
    connectivity_gap_seconds: Number(iotPayload.connectivity_gap_seconds ?? 0),
    network_operator: iotPayload.network_operator || 'orange',
    network_quality: iotPayload.network_quality || 'medium',
    device_temperature_c: Number(deviceTemp),
    reset_count: Number(iotPayload.reset_count ?? 1),
    missing_measurement_count: Number(iotPayload.missing_measurement_count ?? 0),
    sensor_failure_detected: iotPayload.sensor_failure_detected ?? false,
    device_error_code: iotPayload.device_error_code || 'NONE',
    region: iotPayload.region || kitInfo?.region || 'urban_periurban',
    season: iotPayload.season || season,
    day_period: iotPayload.day_period || dayPeriod,
    ambient_temperature_c: Number(iotPayload.ambient_temperature_c ?? ambientTemp),
    humidity_pct: Number(iotPayload.humidity_pct ?? 62),
    installation_type: iotPayload.installation_type || kitInfo?.installationType || 'household_rooftop',
    usage_profile: iotPayload.usage_profile || kitInfo?.usageProfile || 'intensive',
    security_risk_zone: iotPayload.security_risk_zone || 'medium',
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
  const kitId = iotPayload.kit_id || iotPayload.kitId || 'unknown-kit';
  const deviceId = iotPayload.device_id || iotPayload.deviceId || kitId;

  // ── 1. Données contextuelles depuis MongoDB ──────────────────────────────
  const [kitInfo, clientInfo] = await Promise.all([
    Kit.findOne({ kitId }).lean().catch(() => null),
    Client.findOne({ kitId }).lean().catch(() => null),
  ]);

  const clientPhone = kitInfo?.clientPhone || clientInfo?.clientPhone;

  // ── 2. GPS et calcul géofence ────────────────────────────────────────────
  const refLat = kitInfo?.gpsCoordinates?.latitude ?? clientInfo?.gpsCoordinates?.latitude;
  const refLon = kitInfo?.gpsCoordinates?.longitude ?? clientInfo?.gpsCoordinates?.longitude;
  const currentLat = iotPayload.latitude;
  const currentLon = iotPayload.longitude;

  const distance = (currentLat !== undefined && currentLon !== undefined && refLat !== undefined && refLon !== undefined)
    ? getHaversineDistance(refLat, refLon, currentLat, currentLon)
    : Number(iotPayload.distance_from_installation_m ?? 8);
  const geofenceStatus = iotPayload.geofence_status || (distance <= 50 ? 'inside' : 'outside');

  // ── 3. Calcul de l'âge de la batterie ───────────────────────────────────
  const installationDate = kitInfo?.installationDate || clientInfo?.installationDate;
  let batteryAge = 28;
  if (installationDate) {
    const diffMonths = (Date.now() - new Date(installationDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    batteryAge = Math.max(0, Math.round(diffMonths));
  }

  // Estimation SoH si non fourni par le payload
  const stateOfHealth = Math.max(50, Math.min(100, 100 - Math.round(batteryAge * 0.5)));

  const context = { kitId, deviceId, kitInfo, distance, geofenceStatus, batteryAge, stateOfHealth };

  // ── 4. Construire le record actuel ───────────────────────────────────────
  const currentRecord = buildRecord(iotPayload, context);

  // ── 5. Récupérer la télémétrie précédente depuis MongoDB ─────────────────
  const previousDoc = await EnrichedTelemetry.findOne(
    { $or: [{ 'records.0.kit_id': kitId }, { 'identity.kit_id': kitId }] },
    null,
    { sort: { createdAt: -1 } }
  ).lean().catch(() => null);

  // Extraire le dernier record si disponible
  const previousRecord = previousDoc?.records?.[previousDoc.records.length - 1] || null;

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
      tenure_months: batteryAge,
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
