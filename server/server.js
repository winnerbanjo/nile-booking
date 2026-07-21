// server/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';
import { setMockMode } from './utils/mockMode.js';

const app = express();
const PORT = Number(process.env.PORT) || 5050;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_DEMO_SEEDING = process.env.ENABLE_DEMO_SEEDING === 'true';
const PURGE_DEMO_DATA = process.env.PURGE_DEMO_DATA
  ? process.env.PURGE_DEMO_DATA === 'true'
  : IS_PRODUCTION;
const ALLOW_MOCK_MODE = process.env.ALLOW_MOCK_MODE === 'true';

// Middleware - CORS Configuration for Production with Dynamic Subdomain Support
const allowedOrigins = [
  "https://nilebooking.co",
  "https://www.nilebooking.co",
  "https://nile-booking-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];

const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const localNetworkPattern = /^http:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isSubdomain = origin.endsWith('.nilebooking.co');
    const isAllowedMain = allowedOrigins.indexOf(origin) !== -1;
    const isVercelPreview = vercelPreviewPattern.test(origin);
    const isLocalNetwork = localNetworkPattern.test(origin);

    if (isAllowedMain || isSubdomain || isVercelPreview || isLocalNetwork) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// Import routes
import authRoutes from './routes/authRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

const purgeDemoData = async () => {
  const demoEmails = ['barber@nile.ng', 'admin@nile.ng'];
  const demoUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
  const demoProviderIds = demoUsers.map((user) => user._id);

  if (demoProviderIds.length > 0) {
    await Promise.all([
      Booking.deleteMany({
        $or: [
          { provider: { $in: demoProviderIds } },
          { bookingNumber: { $regex: '^NB-DEMO-' } },
        ],
      }),
      Service.deleteMany({ provider: { $in: demoProviderIds } }),
      User.deleteMany({ _id: { $in: demoProviderIds } }),
    ]);
  } else {
    await Booking.deleteMany({ bookingNumber: { $regex: '^NB-DEMO-' } });
  }

  console.log('✅ Demo data purge completed');
};

/**
 * DATABASE INITIALIZATION
 * Production: uses MONGODB_URI only.
 * Development: falls back to local MongoDB.
 */
const initializeDatabase = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/nile_booking_dev';
  const atlasUri = process.env.MONGODB_URI;
  const connectOptions = {
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000,
  };

  if (!atlasUri && IS_PRODUCTION) {
    throw new Error('MONGODB_URI is required in production');
  }

  try {
    const conn = await mongoose.connect(atlasUri || localUri, connectOptions);
    console.log(`🏠 DATABASE CONNECTED: ${conn.connection.host}`);

    if (PURGE_DEMO_DATA) {
      await purgeDemoData();
    }

    if (ENABLE_DEMO_SEEDING) {
      console.log('⚠️ Demo seeding is enabled by environment configuration');
      try {
        const { seedModernBarber } = await import('./scripts/seedModernBarber.js');
        await seedModernBarber();
      } catch (seedErr) {
        console.error('⚠️ Seeding error:', seedErr.message);
      }
    }
  } catch (error) {
    if (ALLOW_MOCK_MODE || !IS_PRODUCTION) {
      console.error('❌ DB connection failed. Enabling MOCK MODE.');
      setMockMode(true);
      return;
    }

    throw error;
  }
};

// Start server only after initialization is complete.
const startServer = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
  🚀 NILE ENGINE LIVE ON ${PORT}
  🎨 LOGO: River N (Green)
  🏦 BANK: Providus | 8123843076
  `);
  });
};

startServer();
