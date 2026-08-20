import mongoose from 'mongoose';

const EnrichedTelemetrySchema = new mongoose.Schema({
  // En utilisant strict: false, tous les 63 champs enrichis (flat format)
  // seront conservés lors de la sauvegarde sans avoir à les lister explicitement.
}, {
  strict: false,
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
});

// Indexation pour des recherches rapides par kit_id / kitId
EnrichedTelemetrySchema.index({ kit_id: 1, createdAt: -1 });
EnrichedTelemetrySchema.index({ kitId: 1, createdAt: -1 });

export default mongoose.model('EnrichedTelemetry', EnrichedTelemetrySchema);
