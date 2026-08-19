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
      default: 'NGN',
    },
    paymentGateway: {
      type: String,
      enum: ['paystack', 'flutterwave', 'bank_transfer', 'pay_later'],
      required: true,
    },
    gatewayReference: {
      type: String,
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    failureReason: {
      type: String,
    },
    initializedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    refundStatus: {
      type: String,
      enum: ['not_refunded', 'refund_pending', 'refunded'],
      default: 'not_refunded',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ provider: 1, status: 1 });
transactionSchema.index({ provider: 1, createdAt: -1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ gatewayReference: 1 });

export default mongoose.model('Transaction', transactionSchema);
