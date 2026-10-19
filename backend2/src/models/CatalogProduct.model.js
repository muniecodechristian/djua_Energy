import mongoose from 'mongoose';

const catalogProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  brand: { type: String, trim: true, maxlength: 80, default: '' },
  model: { type: String, trim: true, maxlength: 80, default: '' },
  watts: { type: Number, required: true, min: 0, max: 10000000 },
  hours: { type: Number, required: true, min: 0, max: 24, default: 5 },
  period: { type: String, enum: ['day', 'night', 'both', 'continuous'], default: 'both' },
  diversity: { type: Number, min: 0, max: 1, default: 0.8 },
  price: { type: Number, min: 0, default: 0 },
  currency: { type: String, enum: ['USD', 'CDF'], default: 'USD' },
  imageData: { type: String, maxlength: 1500000, default: '' },
  active: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

catalogProductSchema.index({ name: 1, brand: 1, model: 1 });

export default mongoose.model('CatalogProduct', catalogProductSchema);
