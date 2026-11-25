import mongoose from 'mongoose';

export const DOMAIN_STATUSES = [
  'PENDING_REGISTRATION',
  'REGISTERING',
  'REGISTERED',
  'PENDING_VERIFICATION',
  'CONNECTING',
  'DNS_PENDING',
  'ACTIVE',
  'FAILED',
  'EXPIRED',
  'SUSPENDED',
  'REMOVED',
];

const dnsRecordSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['A', 'AAAA', 'CNAME', 'TXT', 'MX'], required: true },
    host: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    ttl: { type: Number, default: 3600 },
    status: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  },
  { _id: false }
);

const verificationRecordSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'TXT' },
    host: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const customDomainSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['purchased', 'connected'],
      required: true,
    },
    status: {
      type: String,
      enum: DOMAIN_STATUSES,
      default: 'PENDING_REGISTRATION',
      index: true,
    },
    provider: { type: String, default: 'namecheap' },
    locked: { type: Boolean, default: true },
    active: { type: Boolean, default: false, index: true },
    isPrimary: { type: Boolean, default: true },
    failureReason: { type: String, trim: true, default: null },

    priceUSD: { type: Number, default: null },
    priceNGN: { type: Number, default: null },
    fxRate: { type: Number, default: null },
    isPremiumDomain: { type: Boolean, default: false },
    years: { type: Number, default: 1 },

    registrantEncrypted: { type: String, required: false, select: false },

    verificationToken: { type: String, trim: true, default: null },
    verificationRecord: { type: verificationRecordSchema, default: null },

    registration: {
      orderId: { type: String, trim: true, default: null },
      registeredAt: { type: Date, default: null },
      expiryDate: { type: Date, default: null },
      autoRenew: { type: Boolean, default: false },
      nameservers: { type: [String], default: [] },
    },

    dnsRecords: { type: [dnsRecordSchema], default: [] },

    hosting: {
      provider: { type: String, default: 'vercel' },
      attached: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      misconfigured: { type: Boolean, default: false },
      verificationRecords: { type: [verificationRecordSchema], default: [] },
      checkedAt: { type: Date, default: null },
    },

    renewal: {
      status: {
        type: String,
        enum: ['idle', 'quoted', 'pending_payment', 'paid', 'renewing', 'renewed', 'failed'],
        default: 'idle',
      },
      quotedAt: { type: Date, default: null },
      quoteExpiresAt: { type: Date, default: null },
      priceNGN: { type: Number, default: null },
      priceUSD: { type: Number, default: null },
      reference: { type: String, default: null },
      paidAt: { type: Date, default: null },
      lastReminderAt: { type: Date, default: null },
      expiryReminderStatus: {
        type: String,
        enum: ['idle', 'sending', 'sent', 'failed'],
        default: 'idle',
      },
      expiryReminderSentAt: { type: Date, default: null },
      expiryReminderLastAttemptAt: { type: Date, default: null },
      expiryReminderLeaseUntil: { type: Date, default: null },
      expiryReminderClaimId: { type: String, default: null },
      expiryReminderAttempts: { type: Number, default: 0 },
      expiryReminderError: { type: String, default: null },
      lastError: { type: String, default: null },
    },

    lastCheckedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A merchant can have exactly one active custom domain. Pending rows are allowed
// to coexist only so a failed registration can be retried or cleaned up.
customDomainSchema.index(
  { merchant: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'one_active_domain_per_merchant' }
);
customDomainSchema.index({ status: 1, 'registration.expiryDate': 1 });
customDomainSchema.index({ 'renewal.status': 1, 'registration.expiryDate': 1 });

customDomainSchema.virtual('isActive').get(function isActive() {
  return this.status === 'ACTIVE' && this.active;
});

customDomainSchema.set('toJSON', { virtuals: true });

export default mongoose.model('CustomDomain', customDomainSchema);
