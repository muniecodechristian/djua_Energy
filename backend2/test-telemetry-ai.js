import axios from 'axios';

const payload = {
  "records": [
    {
      "abnormal_consumption_detected": true,
      "ambient_temperature_c": 34,
      "battery_current_a": -4.2,
      "battery_error_code": "NONE",
      "battery_power_w": -49.6,
      "battery_voltage_v": 11.8,
      "charge_duration_seconds": 0,
      "connectivity_type": "lte",
      "day_period": "day",
      "device_id": "device-demo-001",
      "device_temperature_c": 38,
      "discharge_duration_seconds": 1800,
      "enclosure_opened": false,
      "energy_consumed_wh": 950,
      "energy_generated_wh": 620,
      "geofence_status": "inside",
      "humidity_pct": 62,
      "installation_type": "household_rooftop",
      "kit_id": "DJUA-KIN-000001001",
      "latitude": -4.4419,
      "load_current_a": 5.8,
      "load_power_w": 70.2,
      "load_voltage_v": 12.1,
      "longitude": 15.2663,
      "message_id": "msg-maint-001",
      "message_type": "telemetry",
      "missing_measurement_count": 0,
      "network_operator": "orange",
      "overload_detected": false,
      "region": "urban_periurban",
      "schema_version": "1.0",
      "season": "dry",
      "solar_current_a": 3.2,
      "solar_error_code": "NONE",
      "solar_power_w": 58.8,
      "solar_voltage_v": 18.4,
      "speed_mps": 0,
      "state_of_charge_pct": 28,
      "state_of_health_pct": 71
    }
  ]
};

async function testPrediction() {
  try {
    console.log("🚀 Envoi des données à l'API IA (analyze)...");
    const response = await axios.post('https://djua-energy-data-ai.onrender.com/telemetry/analyze', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log("\n=== ✅ RÉPONSE DE L'API IA ===");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("\n=== ❌ ERREUR DE L'API IA ===");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testPrediction();
