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
    unavailableDates: [
      {
        date: { type: Date, required: true },
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
