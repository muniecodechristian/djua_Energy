import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  requestKey: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shopManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesClient', required: true, index: true },
  customer: { type: mongoose.Schema.Types.Mixed, required: true },
  site: { type: mongoose.Schema.Types.Mixed, required: true },
  system: { type: mongoose.Schema.Types.Mixed, required: true },
  appliances: { type: [mongoose.Schema.Types.Mixed], required: true },
  lineItems: {
    type: [{
      category: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true, default: '' },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: ['piece', 'forfait'], default: 'piece' },
      unitPrice: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, enum: ['USD', 'CDF'], required: true },
    }],
    default: [],
  },
  buildingType: String,
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'CDF'], required: true },
  recommendationId: String,
  status: { type: String, enum: ['draft', 'approved', 'rejected', 'installing', 'installed'], default: 'draft', index: true },
  acceptedAt: Date,
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plannedDate: String,
  validatedAt: Date,
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  kitId: String,
  installedAt: Date,
  installedDay: String,
  dateMatched: Boolean,
}, { timestamps: true });
schema.index({ owner: 1, requestKey: 1 }, { unique: true });
schema.index({ kitId: 1 }, { unique: true, partialFilterExpression: { kitId: { $type: 'string' } } });
export default mongoose.model('Quote', schema);
