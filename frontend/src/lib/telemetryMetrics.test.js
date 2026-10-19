import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTelemetryValue, getTelemetryMetrics, groupTelemetryMetrics } from './telemetryMetrics.js';

test('discovers nested contract metrics and preserves null, zero, and negative readings', () => {
  const metrics = getTelemetryMetrics({
    protocol: 'D2T2',
    message_id: 'message-1',
    battery_voltage_v: 12.4,
    battery: { voltage_v: 12.4, current_a: null, power_w: -6.2 },
    solar: { energy_interval_wh: 0 },
    validity: { gps: false, solar_energy: true },
  });
  const byPath = new Map(metrics.map((metric) => [metric.path, metric]));

  assert.equal(byPath.get('battery.voltage_v').value, 12.4);
  assert.equal(byPath.get('battery.current_a').value, null);
  assert.equal(byPath.get('battery.power_w').value, -6.2);
  assert.equal(byPath.get('solar.energy_interval_wh').value, 0);
  assert.equal(byPath.get('validity.gps').value, false);
  assert.equal(byPath.has('battery_voltage_v'), false);
  assert.equal(formatTelemetryValue(null, 'A'), 'Non disponible');
  assert.equal(formatTelemetryValue(0, 'Wh'), '0 Wh');
  assert.equal(formatTelemetryValue(-6.2, 'W'), '-6,2 W');
});

test('automatically includes future nested and extraData fields', () => {
  const metrics = getTelemetryMetrics({
    extraData: { inverter: { heatsink_temperature_c: 47.5 } },
    environment: { humidity_pct: 62 },
    custom_sensor: { particulate_count: 0 },
  });
  const byPath = new Map(metrics.map((metric) => [metric.path, metric]));

  assert.equal(byPath.get('inverter.heatsink_temperature_c').unit, '°C');
  assert.equal(byPath.get('custom_sensor.particulate_count').value, 0);
  assert.equal(byPath.get('environment.humidity_pct').group, 'Environnement');
  assert.equal(groupTelemetryMetrics(metrics).get('Inverter')[0].label, 'Heatsink Temperature');
});

test('supports older flat telemetry records when grouped values are absent', () => {
  const metrics = getTelemetryMetrics({ battery_voltage_v: 12.1, solar_power_w: 0 });
  const byPath = new Map(metrics.map((metric) => [metric.path, metric]));

  assert.equal(byPath.get('battery_voltage_v').unit, 'V');
  assert.equal(byPath.get('solar_power_w').value, 0);
});
