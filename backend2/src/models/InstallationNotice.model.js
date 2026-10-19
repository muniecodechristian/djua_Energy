import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true, unique: true },
  number: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientName: String,
  kitId: String,
  plannedDate: String,
  installedDay: String,
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('InstallationNotice', schema);
