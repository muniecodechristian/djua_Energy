import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentId: {
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
  amountUSD: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Payment', PaymentSchema);
