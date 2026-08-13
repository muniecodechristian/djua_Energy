import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  kitId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clientPhone: {
    type: String,
    required: true,
    index: true,
  },
  offerName: {
    type: String,
  },
  installationDate: {
    type: Date,
  },
  subscriptionFeePaid: {
    type: Boolean,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'terminated'],
  },
  gpsCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Client', ClientSchema);
