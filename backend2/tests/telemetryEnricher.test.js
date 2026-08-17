import { describe, it, expect, vi } from 'vitest';
import { enrichTelemetry } from '../src/services/telemetryEnricher.service.js';

// Mock the Mongoose models to prevent database dependencies in unit tests
vi.mock('../src/models/kit.model.js', () => {
  return {
    default: {
      findOne: () => ({
        lean: () => Promise.resolve({
          kitId: 'kit-demo-001',
          serialNumber: 'SN-DEMO-001',
          gpsCoordinates: { latitude: -4.4419, longitude: 15.2663 },
          installationDate: '2024-04-17T00:00:00.000Z',
          installationType: 'household_rooftop',
          region: 'urban_periurban',
          usageProfile: 'intensive'
        })
      })
    }
  };
});

vi.mock('../src/models/client.model.js', () => {
  return {
    default: {
      findOne: () => ({
        lean: () => Promise.resolve({
          kitId: 'kit-demo-001'
        })
      })
    }
  };
});

describe('Telemetry Enricher Service Tests', () => {
  it('should enrich raw telemetry data from ESP32 to exact 63-field target schema', async () => {
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
      connectivity_gap_seconds: 60,
      device_error_code: "NONE",
      device_temperature_c: 38,
      discharge_duration_seconds: 1800,
      enclosure_opened: false,
      energy_consumed_wh: 950,
      energy_generated_wh: 620,
      gps_accuracy_m: 12,
      impact_detected: false,
      latitude: -4.4419,
      load_current_a: 5.8,
      load_power_w: 70.2,
      load_voltage_v: 12.1,
      longitude: 15.2663,
      movement_detected: false,
      network_quality: "medium",
      overload_detected: false,
      panel_temperature_c: 41,
      schema_version: "1.0",
      sensor_failure_detected: false,
      serial_number: "SN-DEMO-001",
      short_circuit_detected: false,
      solar_current_a: 3.2,
      solar_error_code: "NONE",
      solar_irradiance_w_m2: 780,
      solar_power_w: 58.8,
      solar_voltage_v: 18.4,
      speed_mps: 0,
      state_of_charge_pct: 28,
      tamper_detected: false
    };

    const enriched = await enrichTelemetry(iotPayload);

    // Verify all 63 keys exist
    const keys = Object.keys(enriched);
    expect(keys.length).toBe(63);

    // Assert specific computed values
    expect(enriched.abnormal_consumption_detected).toBe(false);
    expect(enriched.ambient_temperature_c).toBe(34); // device_temperature_c (38) - 4
    expect(enriched.battery_temperature_c).toBe(43.5); // 38 + 5.5 = 43.5
    expect(enriched.geofence_status).toBe('inside'); // exact same coordinates as installation, distance should be 0 (< 50)
    expect(enriched.distance_from_installation_m).toBe(0);
    expect(enriched.connection_status).toBe('connected');
    expect(enriched.connectivity_type).toBe('lte');
    expect(enriched.network_operator).toBe('orange');
    expect(enriched.region).toBe('urban_periurban');
    expect(enriched.usage_profile).toBe('intensive');
    expect(enriched.installation_type).toBe('household_rooftop');
    expect(enriched.identity_mismatch_detected).toBe(false);
  });
});
