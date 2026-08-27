import mongoose from 'mongoose';

const DeviceCommandSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  command: { type: String, required: true },
  status: { type: String, enum: ['pending', 'delivered'], default: 'pending', index: true },
}, { timestamps: true });

DeviceCommandSchema.index({ deviceId: 1, status: 1, createdAt: 1 });

export default mongoose.model('DeviceCommand', DeviceCommandSchema);
