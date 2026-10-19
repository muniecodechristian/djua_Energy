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
  buildingType: String,
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'CDF'], required: true },
  recommendationId: String,
  status: { type: String, enum: ['draft', 'approved', 'installing', 'installed'], default: 'draft', index: true },
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
