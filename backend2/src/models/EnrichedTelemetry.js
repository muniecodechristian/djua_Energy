// src/models/EnrichedTelemetry.js
// Modèle de stockage des données ENRICHIES prêtes pour le ML/IA.
// Générées à partir des données brutes IoT + contexte BDD (Kit, Client, Paiements).
// Format : schéma imbriqué { identity, customer, contract, assignment, payments, records }
// strict: false est maintenu pour permettre l'ajout de champs dynamiques par le pipeline ML.

import mongoose from 'mongoose';

// ── Sous-schéma d'identité ─────────────────────────────────────────────────────
const IdentitySchema = new mongoose.Schema({
  client_id:       { type: String },
  kit_id:          { type: String, index: true },
  device_id:       { type: String },
  installation_id: { type: String },
  contract_id:     { type: String },
  assignment_id:   { type: String },
  resolution_status: { type: String, enum: ['resolved', 'partial', 'unresolved'], default: 'partial' },
}, { _id: false });

// ── Sous-schéma d'un record de télémétrie (1 point de mesure) ─────────────────
const TelemetryRecordSchema = new mongoose.Schema({
  // Identification du message
  message_id:      { type: String },
  schema_version:  { type: String, default: '1.0' },
  message_type:    { type: String, default: 'telemetry' },
  device_id:       { type: String },
  kit_id:          { type: String },
  event_time:      { type: String },
  sequence_number: { type: Number, default: 1 },

  // Batterie
  battery_voltage_v:    { type: Number, default: 0 },
  battery_current_a:    { type: Number, default: 0 },
  battery_power_w:      { type: Number, default: 0 },
  state_of_charge_pct:  { type: Number, default: 100 },
  state_of_health_pct:  { type: Number, default: 100 },
  battery_error_code:   { type: String, default: 'NONE' },
  charge_duration_seconds:    { type: Number, default: 0 },
  discharge_duration_seconds: { type: Number, default: 0 },

  // Solaire
  solar_voltage_v:      { type: Number, default: 0 },
  solar_current_a:      { type: Number, default: 0 },
  solar_power_w:        { type: Number, default: 0 },
  energy_generated_wh:  { type: Number, default: 0 },
  solar_error_code:     { type: String, default: 'NONE' },

  // Charge DC
  load_voltage_v:       { type: Number, default: 0 },
  load_current_a:       { type: Number, default: 0 },
  load_power_w:         { type: Number, default: 0 },
  energy_consumed_wh:   { type: Number, default: 0 },
  overload_detected:    { type: Boolean, default: false },
  abnormal_consumption_detected: { type: Boolean, default: false },

  // Localisation & Environnement
  latitude:             { type: Number, default: 0 },
  longitude:            { type: Number, default: 0 },
  device_temperature_c: { type: Number, default: 0 },
  ambient_temperature_c:{ type: Number, default: 0 },
  humidity_pct:         { type: Number, default: 0 },

  // Contexte géographique
  region:            { type: String, default: 'unknown' },
  installation_type: { type: String, default: 'household_rooftop' },
}, { _id: false, strict: false }); // strict: false pour les champs ML additionnels

// ── Schéma principal EnrichedTelemetry ────────────────────────────────────────
const EnrichedTelemetrySchema = new mongoose.Schema({
  schema_version: { type: String, default: '1.0' },
  request_id:     { type: String },
  as_of:          { type: String },

  // Identité résolue (kit, device, client, contrat)
  identity: { type: IdentitySchema, default: {} },

  // Informations client
  customer: {
    customer_segment: { type: String, default: 'residential' },
    active_contracts: { type: Number, default: 0 },
  },

  // Informations contrat
  contract: {
    contract_id:          { type: String },
    status:               { type: String, default: 'unknown' },
    periodic_amount_usd:  { type: Number, default: 0 },
  },

  // Informations d'assignation kit-client
  assignment: {
    assignment_id: { type: String },
    client_id:     { type: String },
    kit_id:        { type: String },
    device_id:     { type: String },
    status:        { type: String, default: 'unknown' },
  },

  // Historique des paiements (jusqu'à 20 derniers)
  payments: { type: [mongoose.Schema.Types.Mixed], default: [] },

  // Points de mesure télémétrie (1 ou 2 records : précédent + actuel)
  records: { type: [TelemetryRecordSchema], default: [] },

  // Qualité des données
  data_quality: {
    identity_resolved: { type: Boolean, default: false },
    missing_features:  { type: [String], default: [] },
    warnings:          { type: [String], default: [] },
  },
}, {
  strict: false,  // Maintenu pour permettre des champs ML additionnels dynamiques
  timestamps: true,
});

// ── Index pour les recherches rapides ─────────────────────────────────────────
EnrichedTelemetrySchema.index({ 'identity.kit_id': 1, createdAt: -1 });
EnrichedTelemetrySchema.index({ kit_id: 1, createdAt: -1 }); // Rétrocompatibilité
EnrichedTelemetrySchema.index({ kitId: 1, createdAt: -1 });  // Rétrocompatibilité

export default mongoose.model('EnrichedTelemetry', EnrichedTelemetrySchema);
