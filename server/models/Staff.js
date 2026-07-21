import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide staff name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide staff login email'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide staff login password'],
    },
    roleTitle: {
      type: String,
      default: 'Barber / Stylist',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    assignedServices: [
      {
        type: String, // Service ID or Name
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Staff', staffSchema);
