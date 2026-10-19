const ROOT_METADATA_KEYS = new Set([
  'protocol', 'message_id', 'sequence', 'kit_id', 'kitId', 'device_id', 'deviceId',
  'uptime_ms', 'timestamp_ms', 'gateway_received_at', 'timestamp', 'timezone',
  'event_time', 'request_id', 'schema_version', 'message_type', 'sequence_number',
  'identity', 'createdAt', 'updatedAt', 'as_of', 'data_quality', 'customer', 'meta',
  'contract', 'assignment', 'payments', 'latitude', 'longitude', 'region',
  'gpsCoordinates', 'season', 'day_period', 'installation_type',
]);

const GROUP_LABELS = {
  battery: 'Batterie',
  solar: 'Solaire',
  ac_load: 'Charge AC',
  dc_load: 'Charge DC',
  environment: 'Environnement',
  validity: 'Validité des mesures',
};

const FIELD_LABELS = {
  voltage: 'Tension',
  current: 'Courant',
  power: 'Puissance',
  apparent_power: 'Puissance apparente',
  energy_interval: 'Énergie sur l’intervalle',
  state_of_charge: 'Niveau de charge',
  state_of_health: 'État de santé',
  error_code: 'Code erreur',
  device_temperature: 'Température du boîtier',
  ambient_temperature: 'Température ambiante',
  temperature: 'Température',
  humidity: 'Humidité',
  signal_strength: 'Puissance du signal',
  overload_detected: 'Surcharge détectée',
};

const FLAT_ALIASES = {
  battery_voltage_v: 'battery.voltage_v',
  battery_current_a: 'battery.current_a',
  battery_power_w: 'battery.power_w',
  state_of_charge_pct: 'battery.state_of_charge_pct',
  state_of_health_pct: 'battery.state_of_health_pct',
  solar_voltage_v: 'solar.voltage_v',
  solar_current_a: 'solar.current_a',
  solar_power_w: 'solar.power_w',
  energy_generated_wh: 'solar.energy_interval_wh',
  load_voltage_v: 'dc_load.voltage_v',
  load_current_a: 'dc_load.current_a',
  load_power_w: 'dc_load.power_w',
  energy_consumed_wh: 'dc_load.energy_interval_wh',
  ac_load_voltage_v: 'ac_load.voltage_v',
  ac_load_current_a: 'ac_load.current_a',
  ac_apparent_power_va: 'ac_load.apparent_power_va',
  ac_energy_interval_vah: 'ac_load.energy_interval_vah',
  device_temperature_c: 'environment.device_temperature_c',
  ambient_temperature_c: 'environment.ambient_temperature_c',
  humidity_pct: 'environment.humidity_pct',
  signal_strength_dbm: 'environment.signal_strength_dbm',
};

const UNIT_SUFFIXES = [
  ['_energy_interval_vah', 'VAh'],
  ['_apparent_power_va', 'VA'],
  ['_energy_interval_wh', 'Wh'],
  ['_energy_generated_wh', 'Wh'],
  ['_energy_consumed_wh', 'Wh'],
  ['_solar_irradiance_w_m2', 'W/m²'],
  ['_signal_strength_dbm', 'dBm'],
  ['_device_temperature_c', '°C'],
  ['_ambient_temperature_c', '°C'],
  ['_temperature_c', '°C'],
  ['_state_of_charge_pct', '%'],
  ['_state_of_health_pct', '%'],
  ['_battery_voltage_v', 'V'],
  ['_solar_voltage_v', 'V'],
  ['_load_voltage_v', 'V'],
  ['_voltage_v', 'V'],
  ['_battery_current_a', 'A'],
  ['_solar_current_a', 'A'],
  ['_load_current_a', 'A'],
  ['_current_a', 'A'],
  ['_battery_power_w', 'W'],
  ['_solar_power_w', 'W'],
  ['_load_power_w', 'W'],
  ['_power_w', 'W'],
  ['_humidity_pct', '%'],
  ['_pct', '%'],
  ['_dbm', 'dBm'],
  ['_mps', 'm/s'],
  ['_seconds', 's'],
  ['_milliseconds', 'ms'],
  ['_ms', 'ms'],
  ['_vah', 'VAh'],
  ['_va', 'VA'],
  ['_wh', 'Wh'],
  ['_kw', 'kW'],
  ['_kwh', 'kWh'],
  ['_v', 'V'],
  ['_a', 'A'],
  ['_w', 'W'],
  ['_c', '°C'],
  ['_m', 'm'],
];

function humanizeSegment(segment) {
  const normalized = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+(?:w m2|vah|va|wh|kw|kwh|pct|dbm|mps|seconds|milliseconds|ms|v|a|w|c|m)$/, '')
    .replace(/\s+/g, '_');

  return FIELD_LABELS[normalized]
    || normalized.replaceAll('_', ' ').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr-FR'));
}

function unitFor(path) {
  const key = path.split('.').at(-1).toLowerCase();
  return UNIT_SUFFIXES.find(([suffix]) => key.endsWith(suffix))?.[1] ?? '';
}

function chartKeyFor(path) {
  return `metric_${Array.from(path, (character) => character.codePointAt(0).toString(16)).join('_')}`;
}

function scalarDisplayValue(value) {
  if (value == null) return 'Non disponible';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
      : 'Non disponible';
  }
  if (typeof value === 'string') return value || '—';
  if (Array.isArray(value) && value.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item))) {
    return value.map((item) => item == null ? '—' : String(item)).join(', ') || '—';
  }
  return null;
}

export function formatTelemetryValue(value, unit = '') {
  const formatted = scalarDisplayValue(value);
  return formatted == null || !unit || value == null ? (formatted ?? '—') : `${formatted} ${unit}`;
}

export function getTelemetryMetrics(telemetry) {
  if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) return [];

  const metrics = new Map();
  const visit = (value, path = [], depth = 0) => {
    if (depth > 6 || value === undefined) return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (key === 'extraData') {
          visit(child, path, depth + 1);
        } else if (!(path.length === 0 && ROOT_METADATA_KEYS.has(key))) {
          visit(child, [...path, key], depth + 1);
        }
      }
      return;
    }

    const displayValue = scalarDisplayValue(value);
    if (displayValue == null || path.length === 0) return;

    const metricPath = path.join('.');
    const rootField = path.length === 1 ? path[0] : null;
    const group = GROUP_LABELS[path[0]] || (path.length > 1 ? humanizeSegment(path[0]) : 'Autres mesures');
    const fieldPath = path.length > 1 ? path.slice(1) : path;
    const label = fieldPath.map(humanizeSegment).join(' · ');
    metrics.set(metricPath, {
      path: metricPath,
      chartKey: chartKeyFor(metricPath),
      group,
      label,
      unit: unitFor(metricPath),
      value,
    });
    if (rootField && FLAT_ALIASES[rootField] && metrics.has(FLAT_ALIASES[rootField])) return;
  };

  visit(telemetry.extraData && typeof telemetry.extraData === 'object' ? telemetry.extraData : {});
  visit(telemetry);

  return [...metrics.values()]
    .filter((metric) => !FLAT_ALIASES[metric.path] || !metrics.has(FLAT_ALIASES[metric.path]))
    .sort((a, b) => a.group.localeCompare(b.group, 'fr') || a.label.localeCompare(b.label, 'fr'));
}

export function groupTelemetryMetrics(metrics) {
  return metrics.reduce((groups, metric) => {
    const group = groups.get(metric.group) || [];
    group.push(metric);
    groups.set(metric.group, group);
    return groups;
  }, new Map());
}
