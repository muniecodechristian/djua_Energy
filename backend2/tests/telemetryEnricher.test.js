import { describe, it, expect, vi } from 'vitest';
import { enrichTelemetry, normalizeTelemetryPayload } from '../src/services/telemetryEnricher.service.js';

// Mock the Mongoose models to prevent database dependencies in unit tests
vi.mock('../src/models/kit.model.js', () => {
  return {
    default: {
      findOne: () => ({
        lean: () => Promise.resolve({
          kitId: 'kit-demo-001',
          gpsCoordinates: { latitude: -4.4419, longitude: 15.2663 },
          installationDate: '2024-04-17T00:00:00.000Z',
          installationType: 'household_rooftop',
          region: 'urban_periurban',
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
  it('should normalize the ESP32 nested HTTP payload', () => {
    const normalized = normalizeTelemetryPayload({
      kit_id: 'DJUA-KIN-000001',
      timestamp: '2026-08-27T16:00:20Z',
      solar: { voltage_v: 19.36, current_a: 2.12, power_w: 41.08, energy_interval_wh: 0.1141 },
      battery: { voltage_v: 11.94, current_a: -12.44, power_w: -148.62 },
      dc_load: { voltage_v: 12.11, current_a: 1.58, power_w: 19.21, energy_interval_wh: 0.0533 },
      ac_load: { voltage_v: 223.37, current_a: 0.65, apparent_power_va: 145.8, energy_interval_vah: 0.405 },
    });

    expect(normalized.kit_id).toBe('DJUA-KIN-000001');
    expect(normalized.event_time).toBe('2026-08-27T16:00:20Z');
    expect(normalized.solar_power_w).toBe(41.08);
    expect(normalized.battery_current_a).toBe(-12.44);
    expect(normalized.load_power_w).toBe(19.21);
    expect(normalized.ac_apparent_power_va).toBe(145.8);
  });

  it('should enrich raw telemetry data without retired fields', async () => {
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

    const enriched = await enrichTelemetry(iotPayload);
    const record = enriched.records[enriched.records.length - 1];

    const retiredFields = [
      'battery_temperature_c', 'battery_age_months', 'panel_temperature_c',
      'solar_irradiance_w_m2', 'short_circuit_detected', 'gps_accuracy_m',
      'distance_from_installation_m', 'movement_detected', 'movement_duration_seconds',
      'movement_event_count', 'tamper_detected', 'enclosure_opened', 'impact_detected',
      'identity_mismatch_detected', 'connection_status', 'connectivity_gap_seconds',
      'network_quality', 'reset_count', 'sensor_failure_detected', 'device_error_code',
      'usage_profile', 'security_risk_zone', 'tenure_months'
    ];
    expect(retiredFields.every((field) => !(field in record))).toBe(true);

    // Assert specific computed values
    expect(record.abnormal_consumption_detected).toBe(false);
    expect(record.ambient_temperature_c).toBe(34); // device_temperature_c (38) - 4
    expect(record.region).toBe('urban_periurban');
    expect(record.installation_type).toBe('household_rooftop');
  });
});
