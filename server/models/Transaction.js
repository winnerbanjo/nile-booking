import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['payment', 'deposit', 'refund', 'payout'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentGateway: {
      type: String,
      enum: ['paystack', 'flutterwave'],
      required: true,
    },
    gatewayReference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ provider: 1, status: 1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ gatewayReference: 1 });

export default mongoose.model('Transaction', transactionSchema);
