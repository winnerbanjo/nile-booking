import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' },
    serviceName: { type: String, trim: true, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ provider: 1, service: 1 });

export default mongoose.model('Review', reviewSchema);
