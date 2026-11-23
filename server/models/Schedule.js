import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    weeklySchedule: {
      monday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true }, // Format: "HH:mm"
            endTime: { type: String, required: true },
          },
        ],
      },
      tuesday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
      wednesday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
      thursday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
      friday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
      saturday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
      sunday: {
        enabled: { type: Boolean, default: false },
        timeSlots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
    },
    bufferTime: {
      type: Number, // Buffer time in minutes between bookings
      default: 15,
      min: 0,
    },
    // How many days ahead customers may book (server-enforced).
    bookingWindowDays: {
      type: Number,
      default: 60,
      min: 1,
      max: 365,
    },
    // Minimum notice before a slot can be booked (server-enforced).
    minimumLeadTimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    unavailableDates: [
      {
        date: { type: Date, required: true },
        // Optional inclusive end of a blocked range.
        endDate: { type: Date, default: null },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups (provider already has unique index, so no need to duplicate)

export default mongoose.model('Schedule', scheduleSchema);
