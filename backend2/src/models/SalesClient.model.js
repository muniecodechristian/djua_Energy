import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  scope: { type: String, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  searchName: { type: String, required: true },
  email: String,
  address: String,
  profile: String,
  details: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
schema.index({ scope: 1, phone: 1 }, { unique: true });
export default mongoose.model('SalesClient', schema);
