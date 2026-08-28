// src/models/Telemetry.js
// Modèle de stockage des données BRUTES envoyées par l'ESP32 via MQTT ou HTTP.
// Ces données sont conservées telles quelles pour la traçabilité et l'audit.
// Les données enrichies (pour le ML/IA) sont dans EnrichedTelemetry.js

import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  // ── Identification ────────────────────────────────────────────────────────
  kitId: {
    type: String,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    index: true,
  },

  // ── Localisation GPS ─────────────────────────────────────────────────────
  gpsCoordinates: {
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
  },

  // ── Métriques batterie ────────────────────────────────────────────────────
  battery: {
    voltage_v:          { type: Number, default: null },  // Tension batterie (V)
    current_a:          { type: Number, default: null },  // Courant batterie (A)
    power_w:            { type: Number, default: null },  // Puissance batterie (W)
    state_of_charge_pct:{ type: Number, default: null },  // État de charge (%)
    state_of_health_pct:{ type: Number, default: null },  // État de santé (%)
    error_code:         { type: String, default: 'NONE' },
  },

  // ── Métriques panneau solaire ─────────────────────────────────────────────
  solar: {
    voltage_v:         { type: Number, default: null },   // Tension PV (V)
    current_a:         { type: Number, default: null },   // Courant PV (A)
    power_w:           { type: Number, default: null },   // Puissance PV (W)
    energy_interval_wh:{ type: Number, default: null },   // Énergie générée (Wh)
    error_code:        { type: String, default: 'NONE' },
  },

  // ── Métriques charge DC (sortie directe) ──────────────────────────────────
  dc_load: {
    voltage_v:         { type: Number, default: null },   // Tension charge DC (V)
    current_a:         { type: Number, default: null },   // Courant charge DC (A)
    power_w:           { type: Number, default: null },   // Puissance charge DC (W)
    energy_interval_wh:{ type: Number, default: null },   // Énergie consommée (Wh)
    overload_detected: { type: Boolean, default: false },
  },

  // ── Métriques charge AC (onduleur) ────────────────────────────────────────
  ac_load: {
    voltage_v:          { type: Number, default: null },  // Tension sortie AC (V)
    current_a:          { type: Number, default: null },  // Courant sortie AC (A)
    apparent_power_va:  { type: Number, default: null },  // Puissance apparente (VA)
    energy_interval_vah:{ type: Number, default: null },  // Énergie AC (VAh)
  },

  // ── Environnement ──────────────────────────────────────────────────────────
  environment: {
    device_temperature_c: { type: Number, default: null }, // Temp. boîtier (°C)
    ambient_temperature_c:{ type: Number, default: null }, // Temp. ambiante (°C)
    humidity_pct:         { type: Number, default: null }, // Humidité (%)
    signal_strength_dbm:  { type: Number, default: null }, // RSSI (dBm)
  },

  // ── Méta-données du message IoT ────────────────────────────────────────────
  meta: {
    message_id:      { type: String },
    schema_version:  { type: String, default: '1.0' },
    message_type:    { type: String, default: 'telemetry' },
    event_time:      { type: String },                     // Timestamp ISO ou epoch
    sequence_number: { type: Number, default: 1 },
    interval_seconds:{ type: Number, default: null },
  },

  // ── Champ libre pour toute donnée supplémentaire non standard ─────────────
  extraData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true, // Ajoute createdAt / updatedAt automatiquement
});

// ── Index composés pour des requêtes rapides ───────────────────────────────────
TelemetrySchema.index({ kitId: 1, createdAt: -1 });
TelemetrySchema.index({ deviceId: 1, createdAt: -1 });

export default mongoose.model('Telemetry', TelemetrySchema);