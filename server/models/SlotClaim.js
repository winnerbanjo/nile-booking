import mongoose from 'mongoose';

/**
 * One document per occupied minute of a provider's calendar.
 *
 * A unique index on `unitKey` (`${provider}:${epochMinute}`) makes claiming a
 * time range atomic: two overlapping bookings share at least one minute, so the
 * second insert always hits a duplicate key before either request responds.
 * Claims are the write-side lock; bookings remain the read-side source of truth.
 */
const slotClaimSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    // Epoch minute (UTC) that this claim occupies.
    unit: {
      type: Number,
      required: true,
    },
    unitKey: {
      type: String,
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    // Null means the claim never expires (confirmed booking, or receipt attached).
    expiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['held', 'confirmed'],
      default: 'held',
    },
    // Identifies one claim attempt so partial inserts can be rolled back.
    attemptId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

slotClaimSchema.index({ unitKey: 1 }, { unique: true });
slotClaimSchema.index({ booking: 1 });
slotClaimSchema.index({ provider: 1, expiresAt: 1 });

export default mongoose.model('SlotClaim', slotClaimSchema);
