import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
    // On garde le type String pour correspondre exactement à ton KitSchema
    kitId: {
        type: String,
        required: true,
        index: true,
    },

    source: {
        type: String,
        enum: ['iot_esp32', 'geofencing', 'system'],
        required: true,
    },

    type: {
        type: String,
        required: true, // ex: 'low_voltage', 'geofence_exit', 'offline'
    },

    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low', 'info'],
        required: true,
    },

    label: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    // Données brutes envoyées par l'ESP32 (tension, température, etc.)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved'],
        default: 'active',
        index: true,
    },

    resolvedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});



AlertSchema.virtual('kitDetails', {
    ref: 'Kit',
    localField: 'kitId',
    foreignField: 'kitId',
    justOne: true
});

// Permet d'inclure les données du kit lors de la conversion en JSON / .lean()
AlertSchema.set('toObject', { virtuals: true });
AlertSchema.set('toJSON', { virtuals: true });


AlertSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Alert', AlertSchema);