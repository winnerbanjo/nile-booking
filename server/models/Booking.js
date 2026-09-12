import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
      phone: { type: String, required: true },
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['awaiting_payment', 'awaiting_verification', 'confirmed', 'cancelled'],
      default: 'awaiting_payment',
    },
    paymentType: {
      type: String,
      enum: ['full', 'deposit', 'pay_later', 'bank_transfer'],
      required: true,
    },
    pricing: {
      servicePrice: { type: Number, required: true },
      depositAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    paymentGateway: {
      type: String,
      enum: ['paystack', 'flutterwave', null],
      default: null,
    },
    paymentReference: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    whatsappLink: {
      type: String,
      default: null,
    },
    receiptImageUrl: {
      type: String,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Required fields are checked before save middleware runs.
// Generate the reference before validation, without a database count/race.
bookingSchema.pre('validate', function () {
  if (!this.bookingNumber) {
    this.bookingNumber = `NB-${randomUUID()}`;
  }
});

bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ date: 1 });

export default mongoose.model('Booking', bookingSchema);
