import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema(
  {
    kitId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Basse', 'Moyenne', 'Haute', 'Critique'],
      default: 'Moyenne'
    },
    status: {
      type: String,
      enum: ['Brouillon', 'Planifiée', 'En cours', 'Terminée', 'Annulée'],
      default: 'Planifiée'
    },
    scheduledDate: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '14d' // Supprimé automatiquement après 2 semaines
    }
  }
);

export const Intervention = mongoose.model('Intervention', interventionSchema);
