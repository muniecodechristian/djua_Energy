/**
 * simulate-telemetry.js
 * Script de simulation IoT : envoie en boucle des données normale → critique → moyen
 * toutes les 2 secondes via le proxy backend local.
 * 
 * Lancement : node simulate-telemetry.js
 * Arrêt     : Ctrl+C
 */
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const INTERVAL_MS = 10000;

const SCENARIOS = [
  {
    label: '🟢 NORMAL',
    data: {
      abnormal_consumption_detected: false,
      ambient_temperature_c: 27,
      battery_current_a: 2.1,
      battery_error_code: "NONE",
      battery_power_w: 25.2,
      battery_voltage_v: 13.1,
      charge_duration_seconds: 3600,
      connectivity_type: "lte",
      day_period: "day",
      device_id: "device-demo-001",
      device_temperature_c: 28,
      discharge_duration_seconds: 0,
      enclosure_opened: false,
      energy_consumed_wh: 420,
      energy_generated_wh: 680,
      geofence_status: "inside",
      humidity_pct: 55,
      installation_type: "household_rooftop",
      kit_id: "DJUA-KIN-000001001",
      latitude: -4.4419,
      load_current_a: 2.0,
      load_power_w: 24.0,
      load_voltage_v: 12.0,
      longitude: 15.2663,
      message_type: "telemetry",
      missing_measurement_count: 0,
      network_operator: "orange",
      overload_detected: false,
      region: "urban_periurban",
      schema_version: "1.0",
      season: "dry",
      solar_current_a: 5.2,
      solar_error_code: "NONE",
      solar_power_w: 94.4,
      solar_voltage_v: 18.1,
      speed_mps: 0,
      state_of_charge_pct: 82,
      state_of_health_pct: 91,
    }
  },
  {
    label: '🔴 CRITIQUE',
    data: {
      abnormal_consumption_detected: true,
      ambient_temperature_c: 39,
      battery_current_a: -6.1,
      battery_error_code: "UNDERVOLT",
      battery_power_w: -71.4,
      battery_voltage_v: 10.9,
      charge_duration_seconds: 0,
      connectivity_type: "lte",
      day_period: "day",
      device_id: "device-demo-001",
      device_temperature_c: 48,
      discharge_duration_seconds: 7200,
      enclosure_opened: true,
      energy_consumed_wh: 1200,
      energy_generated_wh: 180,
      geofence_status: "outside",
      humidity_pct: 78,
      installation_type: "household_rooftop",
      kit_id: "DJUA-KIN-000001001",
      latitude: -4.5010,
      load_current_a: 8.5,
      load_power_w: 102.0,
      load_voltage_v: 12.0,
      longitude: 15.3100,
      message_type: "telemetry",
      missing_measurement_count: 3,
      network_operator: "orange",
      overload_detected: true,
      region: "urban_periurban",
      schema_version: "1.0",
      season: "dry",
      solar_current_a: 0.8,
      solar_error_code: "PANEL_FAULT",
      solar_power_w: 12.8,
      solar_voltage_v: 16.0,
      speed_mps: 2.4,
      state_of_charge_pct: 15,
      state_of_health_pct: 58,
    }
  },
  {
    label: '🟡 MOYEN',
    data: {
      abnormal_consumption_detected: false,
      ambient_temperature_c: 33,
      battery_current_a: -3.0,
      battery_error_code: "NONE",
      battery_power_w: -36.0,
      battery_voltage_v: 12.0,
      charge_duration_seconds: 600,
      connectivity_type: "lte",
      day_period: "day",
      device_id: "device-demo-001",
      device_temperature_c: 35,
      discharge_duration_seconds: 3600,
      enclosure_opened: false,
      energy_consumed_wh: 720,
      energy_generated_wh: 480,
      geofence_status: "inside",
      humidity_pct: 63,
      installation_type: "household_rooftop",
      kit_id: "DJUA-KIN-000001001",
      latitude: -4.4419,
      load_current_a: 4.5,
      load_power_w: 54.0,
      load_voltage_v: 12.0,
      longitude: 15.2663,
      message_type: "telemetry",
      missing_measurement_count: 1,
      network_operator: "orange",
      overload_detected: false,
      region: "urban_periurban",
      schema_version: "1.0",
      season: "dry",
      solar_current_a: 2.5,
      solar_error_code: "NONE",
      solar_power_w: 45.0,
      solar_voltage_v: 18.0,
      speed_mps: 0,
      state_of_charge_pct: 41,
      state_of_health_pct: 74,
    }
  }
];

let step = 0;

async function sendTelemetry() {
  const scenario = SCENARIOS[step % SCENARIOS.length];
  const payload = {
    records: [{
      ...scenario.data,
      message_id: `msg-sim-${Date.now()}`
    }]
  };

  process.stdout.write(`\n[${new Date().toLocaleTimeString('fr-FR')}] ${scenario.label} → Envoi en cours...`);

  try {
    const { data } = await axios.post(`${BACKEND_URL}/ai/analyze-test`, payload);
    console.log(`  Réponse reçue`);
    console.log(`   status: ${data.status} | alert: ${data.alert ? JSON.stringify(data.alert).slice(0, 100) + '...' : 'null'}`);
  } catch (err) {
    console.log(` Erreur: ${err.response?.data?.error || err.message}`);
  }

  step++;
}

console.log('🚀 Simulation IoT démarrée (Ctrl+C pour arrêter)');
console.log(`   Backend : ${BACKEND_URL}`);
console.log(`   Cycle : NORMAL → CRITIQUE → MOYEN toutes les ${INTERVAL_MS / 1000}s`);
console.log(`   Premier envoi dans 8 secondes...\n`);

// Attente de 8s avant le premier envoi, puis cycle toutes les INTERVAL_MS
setTimeout(() => {
  sendTelemetry();
  setInterval(sendTelemetry, INTERVAL_MS);
}, 8000);
