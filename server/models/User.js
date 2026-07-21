import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin'],
      default: 'customer',
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'Nigeria',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      trim: true,
    },
    otpExpires: {
      type: Date,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    headerImage: {
      type: String,
      trim: true,
    },
    policies: {
      terms: {
        type: String,
        default: 'All bookings must be confirmed in advance. Cancellations made at least 24 hours prior to appointment time are eligible for reschedule.',
      },
      returnPolicy: {
        type: String,
        default: 'Services completed are non-refundable. Deposits for cancelled bookings may be transferred to a new slot within 30 days.',
      },
      privacyPolicy: {
        type: String,
        default: 'We value your privacy and only use your details for scheduling and confirmation updates.',
      },
    },
    address: {
      street: String,
      city: String,
      country: String,
      zipCode: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      whatsappEnabled: {
        type: Boolean,
        default: true,
      },
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      whatsappReminders: {
        type: Boolean,
        default: true,
      },
      emailReceipts: {
        type: Boolean,
        default: true,
      },
    },
    bankAccount: {
      bankName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      accountName: {
        type: String,
        trim: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      subaccountCode: {
        type: String,
        trim: true,
      },
    },
    socialHandles: {
      instagram: {
        type: String,
        trim: true,
      },
      whatsapp: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
    },
    gallery: [
      {
        url: {
          type: String,
          trim: true,
        },
        alt: {
          type: String,
          trim: true,
        },
      },
    ],
    testimonials: [
      {
        name: {
          type: String,
          trim: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
