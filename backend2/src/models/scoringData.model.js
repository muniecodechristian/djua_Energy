import mongoose from 'mongoose';

const ScoringDataSchema = new mongoose.Schema({
  clientPhone: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  client: {
    accountNumber: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    orangeMoneyAccountAgeMonths: { type: Number },
    estimatedIncomeUSD: { type: Number },
    profession: { type: String },
    historicalRiskScore: { type: Number },
  },
  subscription: {
    kitId: { type: String },
    offerName: { type: String },
    status: { type: String },
    paidMonthsCount: { type: Number },
  },
  paymentHistory: [{
    paymentId: { type: String, required: true },
    clientPhone: { type: String },
    amountUSD: { type: Number },
    date: { type: Date },
    status: { type: String },
    description: { type: String },
  }],
}, {
  timestamps: true,
});

export default mongoose.model('ScoringData', ScoringDataSchema);
