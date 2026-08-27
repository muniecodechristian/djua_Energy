import { enrichTelemetry } from '../services/telemetryEnricher.service.js';
import mongoose from 'mongoose';
import Kit from '../models/kit.model.js';
import Client from '../models/client.model.js';

// Disable mongoose query buffering so it fails fast or returns immediately
mongoose.set('bufferCommands', false);

// Mock the model query methods to simulate database records
Kit.findOne = () => ({
  lean: () => Promise.resolve({
    kitId: 'kit-demo-001',
    gpsCoordinates: { latitude: -4.4419, longitude: 15.2663 },
    installationDate: '2024-04-17T00:00:00.000Z',
    installationType: 'household_rooftop',
    region: 'urban_periurban',
  })
});

Client.findOne = () => ({
  lean: () => Promise.resolve({
    kitId: 'kit-demo-001'
  })
});

async function run() {
  const iotPayload = {
    message_id: "msg-maint-001",
    message_type: "telemetry",
    device_id: "device-demo-001",
    kit_id: "kit-demo-001",
    battery_current_a: -4.2,
    battery_error_code: "NONE",
    battery_power_w: -49.6,
    battery_voltage_v: 11.8,
    charge_duration_seconds: 0,
    device_temperature_c: 38,
    discharge_duration_seconds: 1800,
    enclosure_opened: false,
    energy_consumed_wh: 950,
    energy_generated_wh: 620,
    latitude: -4.4419,
    load_current_a: 5.8,
    load_power_w: 70.2,
    load_voltage_v: 12.1,
    longitude: 15.2663,
    overload_detected: false,
    schema_version: "1.0",
    solar_current_a: 3.2,
    solar_error_code: "NONE",
    solar_power_w: 58.8,
    solar_voltage_v: 18.4,
    speed_mps: 0,
    state_of_charge_pct: 28,
  };

  try {
    const result = await enrichTelemetry(iotPayload);
    const keys = Object.keys(result);
    console.log("=== TELEMETRY ENRICHMENT VERIFICATION ===");
    console.log("Total Keys Count: ", keys.length);
    console.log("JSON Result:\n", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

run();
