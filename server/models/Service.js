import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a service name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['cruise', 'hotel', 'tour', 'restaurant', 'transportation', 'other'],
      default: 'other',
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price must be positive'],
    },
    duration: {
      type: Number, // Duration in hours
      required: [true, 'Please provide duration'],
      min: [0, 'Duration must be positive'],
    },
    capacity: {
      type: Number,
      default: 1,
      min: [1, 'Capacity must be at least 1'],
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    location: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    availability: {
      startDate: Date,
      endDate: Date,
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6, // 0 = Sunday, 6 = Saturday
        },
      ],
      timeSlots: [
        {
          startTime: String, // Format: "HH:mm"
          endTime: String,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [String], // e.g., ["WiFi", "Breakfast", "Pool"]
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Service', serviceSchema);
