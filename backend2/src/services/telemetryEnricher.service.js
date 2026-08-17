// src/services/telemetryEnricher.service.js
import Kit from '../models/kit.model.js';
import Client from '../models/client.model.js';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371000; // Rayon de la Terre en mètres
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
 * Enriches raw telemetry payloads from the ESP32 to strictly match the 63-field AI model schema.
 * 
 * @param {object} iotPayload - Raw MQTT/HTTP payload sent by the ESP32
 * @returns {Promise<object>} Fully enriched 63-field target payload ready for the AI model
 */
export async function enrichTelemetry(iotPayload) {
  const kitId = iotPayload.kit_id || iotPayload.kitId || 'unknown-kit';
  const deviceId = iotPayload.device_id || iotPayload.deviceId || kitId;

  // 1. Récupération des données statiques/métadonnées du kit et client depuis la base locale MongoDB
  const kitInfo = await Kit.findOne({ kitId }).lean().catch(() => null);
  const clientInfo = await Client.findOne({ kitId }).lean().catch(() => null);

  // 2. Extraction des points GPS et dates de référence
  const refLat = kitInfo?.gpsCoordinates?.latitude ?? clientInfo?.gpsCoordinates?.latitude;
  const refLon = kitInfo?.gpsCoordinates?.longitude ?? clientInfo?.gpsCoordinates?.longitude;
  const installationDate = kitInfo?.installationDate || clientInfo?.installationDate;

  // 3. Calculs dérivés de la position et de l'état
  const currentLat = iotPayload.latitude;
  const currentLon = iotPayload.longitude;
  
  // Calcul de la distance géofence (Haversine)
  const distance = (currentLat !== undefined && currentLon !== undefined && refLat !== undefined && refLon !== undefined)
    ? getHaversineDistance(refLat, refLon, currentLat, currentLon)
    : 8; // Valeur par défaut si non résolu

  const geofenceStatus = distance <= 50 ? 'inside' : 'outside';

  // Calcul de l'âge de la batterie en mois
  let batteryAge = 28; // Valeur par défaut si non disponible
  if (installationDate) {
    const installTime = new Date(installationDate).getTime();
    const nowTime = Date.now();
    const diffMonths = (nowTime - installTime) / (1000 * 60 * 60 * 24 * 30.4375);
    batteryAge = Math.max(0, Math.round(diffMonths));
  }

  // Calcul du cycle jour/nuit (Day Period)
  const currentHour = new Date().getHours();
  const dayPeriod = (currentHour >= 6 && currentHour < 18) ? 'day' : 'night';

  // Calcul de la saison locale
  const currentMonth = new Date().getMonth();
  const season = (currentMonth >= 4 && currentMonth <= 9) ? 'wet' : 'dry';

  // Estimation du State of Health (SoH) en fonction de l'âge
  const stateOfHealth = Math.max(50, Math.min(100, 100 - Math.round(batteryAge * 0.5)));

  // Estimation des températures interne/externe
  const deviceTemp = iotPayload.device_temperature_c ?? 38;
  const ambientTemp = iotPayload.device_temperature_c ? Math.round(iotPayload.device_temperature_c - 4) : 34;
  const batteryTemp = iotPayload.device_temperature_c ? Math.round(iotPayload.device_temperature_c + 5.5) : 43.5;

  // 4. Assemblage strict des 63 champs requis par l'IA
  return {
    abnormal_consumption_detected: iotPayload.overload_detected || false,
    ambient_temperature_c: Number(ambientTemp),
    battery_age_months: Number(batteryAge),
    battery_current_a: Number(iotPayload.battery_current_a ?? 0.0),
    battery_error_code: iotPayload.battery_error_code || 'NONE',
    battery_power_w: Number(iotPayload.battery_power_w ?? (iotPayload.battery_current_a && iotPayload.battery_voltage_v ? (iotPayload.battery_current_a * iotPayload.battery_voltage_v).toFixed(2) : 0.0)),
    battery_temperature_c: Number(batteryTemp),
    battery_voltage_v: Number(iotPayload.battery_voltage_v ?? 0.0),
    charge_duration_seconds: Number(iotPayload.charge_duration_seconds ?? 0),
    connection_status: 'connected',
    connectivity_gap_seconds: Number(iotPayload.connectivity_gap_seconds ?? 0),
    connectivity_type: 'lte',
    day_period: dayPeriod,
    device_error_code: iotPayload.device_error_code || 'NONE',
    device_id: deviceId,
    device_temperature_c: Number(deviceTemp),
    discharge_duration_seconds: Number(iotPayload.discharge_duration_seconds ?? 0),
    distance_from_installation_m: Number(distance),
    enclosure_opened: iotPayload.enclosure_opened ?? false,
    energy_consumed_wh: Number(iotPayload.energy_consumed_wh ?? 0),
    energy_generated_wh: Number(iotPayload.energy_generated_wh ?? 0),
    event_time: String(Math.floor(Date.now() / 1000)),
    geofence_status: geofenceStatus,
    gps_accuracy_m: Number(iotPayload.gps_accuracy_m ?? 10),
    humidity_pct: 62, // Humidité moyenne standard
    identity_mismatch_detected: iotPayload.serial_number && kitInfo?.serialNumber ? (iotPayload.serial_number !== kitInfo.serialNumber) : false,
    impact_detected: iotPayload.impact_detected ?? false,
    installation_type: kitInfo?.installationType || 'household_rooftop',
    kit_id: kitId,
    latitude: Number(currentLat ?? 0.0),
    load_current_a: Number(iotPayload.load_current_a ?? 0.0),
    load_power_w: Number(iotPayload.load_power_w ?? 0.0),
    load_voltage_v: Number(iotPayload.load_voltage_v ?? 0.0),
    longitude: Number(currentLon ?? 0.0),
    message_id: iotPayload.message_id || `msg-${Date.now()}`,
    message_type: iotPayload.message_type || 'telemetry',
    missing_measurement_count: 0,
    movement_detected: iotPayload.movement_detected ?? false,
    movement_duration_seconds: 0,
    movement_event_count: 0,
    network_operator: 'orange',
    network_quality: iotPayload.network_quality || 'medium',
    overload_detected: iotPayload.overload_detected ?? false,
    panel_temperature_c: Number(iotPayload.panel_temperature_c ?? 40),
    region: kitInfo?.region || 'urban_periurban',
    reset_count: 1,
    schema_version: String(iotPayload.schema_version || '1.0'),
    season: season,
    security_risk_zone: 'medium',
    sensor_failure_detected: iotPayload.sensor_failure_detected ?? false,
    sequence_number: Number(iotPayload.sequence_number ?? 1),
    serial_number: iotPayload.serial_number || 'SN-UNKNOWN',
    short_circuit_detected: iotPayload.short_circuit_detected ?? false,
    solar_current_a: Number(iotPayload.solar_current_a ?? 0.0),
    solar_error_code: iotPayload.solar_error_code || 'NONE',
    solar_irradiance_w_m2: Number(iotPayload.solar_irradiance_w_m2 ?? 0),
    solar_power_w: Number(iotPayload.solar_power_w ?? 0.0),
    solar_voltage_v: Number(iotPayload.solar_voltage_v ?? 0.0),
    speed_mps: Number(iotPayload.speed_mps ?? 0),
    state_of_charge_pct: Number(iotPayload.state_of_charge_pct ?? 100),
    state_of_health_pct: Number(stateOfHealth),
    tamper_detected: iotPayload.tamper_detected ?? false,
    usage_profile: kitInfo?.usageProfile || 'intensive'
  };
}
