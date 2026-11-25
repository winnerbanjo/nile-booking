import mongoose from 'mongoose';

const domainPaymentSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomDomain',
      required: true,
      index: true,
    },
    provider: { type: String, default: 'paystack' },
    purpose: { type: String, enum: ['domain-renewal'], required: true },
    reference: { type: String, required: true, unique: true, trim: true },
    amountNGN: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'renewing', 'renewed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    providerEventId: { type: String, trim: true, default: null },
    paidAt: { type: Date, default: null },
    renewedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

domainPaymentSchema.index({ domain: 1, status: 1 });

export default mongoose.model('DomainPayment', domainPaymentSchema);
