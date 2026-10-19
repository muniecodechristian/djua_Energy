import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema(
  {
    kitId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Catégorie de l'intervention
    type: {
      type: String,
      enum: ['maintenance', 'repair', 'inspection', 'installation'],
      default: 'maintenance',
    },

    priority: {
      type: String,
      enum: ['Basse', 'Moyenne', 'Haute', 'Critique'],
      default: 'Moyenne',
    },

    status: {
      type: String,
      enum: ['Planifiée', 'En cours', 'Terminée', 'Annulée'],
      default: 'Planifiée',
    },

    scheduledDate: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ── Assignation & traçabilité ──────────────────────────────────────────────
    // Technicien assigné à cette intervention
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Un technicien doit être assigné'],
      index: true,
    },

    // Shop Manager créateur de l'intervention
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le créateur est requis'],
      index: true,
    },

    // Rapport rédigé par le technicien après intervention
    report: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes composés pour les requêtes fréquentes
interventionSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
interventionSchema.index({ createdBy: 1, createdAt: -1 });
interventionSchema.index({ kitId: 1, status: 1 });

export const Intervention = mongoose.model('Intervention', interventionSchema);

