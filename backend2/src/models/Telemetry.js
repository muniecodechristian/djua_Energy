import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
    kitId: {
        type: String,
        required: true,
        index: true,
    },


    gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
    },

    // Les métriques physiques standard envoyées par l'ESP32
    metrics: {
        voltage: { type: Number },         // Tension (V)
        current: { type: Number },         // Courant (A)
        power: { type: Number },           // Puissance (W)
        batteryLevel: { type: Number },    // Pourcentage de batterie (%)
        temperature: { type: Number },     // Température du boîtier (°C)
        signalStrength: { type: Number },  // RSSI / Qualité réseau (dBm)
    },

    // Espace libre (Mixed) pour stocker d'autres variables spécifiques sans bloquer la base
    extraData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});


TelemetrySchema.index({ kitId: 1, createdAt: -1 });

export default mongoose.model('Telemetry', TelemetrySchema);