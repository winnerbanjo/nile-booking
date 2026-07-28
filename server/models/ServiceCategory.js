import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    normalizedName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    colour: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

serviceCategorySchema.index(
  { merchantId: 1, normalizedName: 1 },
  { unique: true }
);

serviceCategorySchema.index(
  { merchantId: 1, slug: 1 },
  { unique: true }
);

serviceCategorySchema.index({
  merchantId: 1,
  isActive: 1,
  sortOrder: 1,
});

export default mongoose.model('ServiceCategory', serviceCategorySchema);
