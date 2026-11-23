import mongoose from 'mongoose';
import { randomBytes, randomUUID } from 'node:crypto';

const notificationStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['not_sent', 'pending', 'sent', 'failed', 'skipped'],
      default: 'not_sent',
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { _id: false }
);

const reminderStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['not_sent', 'sending', 'sent', 'failed', 'skipped'],
      default: 'not_sent',
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    error: { type: String, default: null },
    leaseUntil: { type: Date, default: null },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    // Unguessable customer access token. Never expose it through provider list
    // queries; it is returned only from create and used in customer links.
    publicToken: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
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
    // Canonical UTC instant of the appointment. Availability, conflicts and
    // holds are decided from these fields, never from the display strings.
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    // Provider-local display strings (HH:mm).
    timeSlot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    // How the customer intends to pay, used only to schedule the slot hold.
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'pay_later', 'card'],
      default: 'bank_transfer',
    },
    // When an unpaid pending booking releases the slot. Null = never (receipt
    // attached, confirmed, or pay-in-person per cash policy).
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    // Client-supplied per-submit key; unique per provider when present.
    idempotencyKey: {
      type: String,
      default: undefined,
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
    // Money truth, kept alongside `pricing` for backward compatibility.
    totalPrice: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    amountReceived: { type: Number, default: 0 },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    verificationOverrideReason: { type: String, default: null },
    cashAcknowledged: { type: Boolean, default: false },
    cashAcknowledgedAt: { type: Date, default: null },
    confirmationEmail: {
      status: {
        type: String,
        enum: ['not_sent', 'pending', 'sent', 'failed'],
        default: 'not_sent',
      },
      sentAt: { type: Date, default: null },
      error: { type: String, default: null },
    },
    notifications: {
      bookingReceivedCustomer: { type: notificationStateSchema, default: () => ({}) },
      bookingReceivedProvider: { type: notificationStateSchema, default: () => ({}) },
      cancellationCustomer: { type: notificationStateSchema, default: () => ({}) },
      cancellationProvider: { type: notificationStateSchema, default: () => ({}) },
    },
    reminders: {
      unpaidHold: { type: reminderStateSchema, default: () => ({}) },
      appointment: { type: reminderStateSchema, default: () => ({}) },
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
    // Legacy flag retained for old records; new reminders use `reminders`.
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
  if (!this.publicToken) {
    this.publicToken = randomBytes(32).toString('hex');
  }
});

bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ provider: 1, startAt: 1, endAt: 1 });
bookingSchema.index(
  { provider: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1, 'reminders.unpaidHold.status': 1, holdExpiresAt: 1 });
bookingSchema.index({ status: 1, 'reminders.appointment.status': 1, startAt: 1 });

// Any code path that confirms/cancels a booking keeps slot claims in sync —
// including payment verification, which never touches the availability service.
bookingSchema.post('save', async function (doc) {
  try {
    if (doc.status === 'confirmed') {
      const { confirmSlot } = await import('../services/availabilityService.js');
      await doc.constructor.updateOne({ _id: doc._id }, { $set: { holdExpiresAt: null } });
      await confirmSlot(doc._id);
    } else if (doc.status === 'cancelled' || doc.status === 'rejected') {
      const { releaseSlot } = await import('../services/availabilityService.js');
      await releaseSlot(doc._id, doc.status);
    }
  } catch (error) {
    console.error('[availability] failed to sync claims for booking', doc._id?.toString(), error.message);
  }
});
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ date: 1 });

export default mongoose.model('Booking', bookingSchema);
