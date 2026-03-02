import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
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
      enum: ['pending', 'pending_verification', 'partial', 'paid', 'refunded'],
      default: 'pending',
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

// Generate unique booking number
bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `NB-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes (bookingNumber already has unique index, so no need to duplicate)
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ date: 1 });

export default mongoose.model('Booking', bookingSchema);
