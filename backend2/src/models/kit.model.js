import mongoose from 'mongoose';

const KitSchema = new mongoose.Schema({
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
    required: true,
  },
  installationDate: {
    type: String,
  },
  subscriptionFeePaid: {
    type: Boolean,
    default: false,
  },
  periodicAmountUSD: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'terminated'],
    default: 'active',
  },
  paidMonthsCount: {
    type: Number,
    default: 0,
  },
  gpsCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Kit', KitSchema);
