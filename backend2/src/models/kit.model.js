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
  adminStatusOverride: {
    type: String,
    enum: ['active', 'suspended'],
    default: null,
  },
  paidMonthsCount: {
    type: Number,
    default: 0,
  },
  gpsCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  quoteId: { type: String, index: true },
  salesClient: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesClient' },
  clientName: String,
  installedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, enum: ['quote', 'manual'] },
  system: mongoose.Schema.Types.Mixed,
  appliances: [mongoose.Schema.Types.Mixed],
  diagnosticStatus: String,
  diagnosticChecks: [mongoose.Schema.Types.Mixed],
  zone: {
    type: String,
    trim: true,
    default: '',
  },
  shopManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Kit', KitSchema);
