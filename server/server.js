// server/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Schedule from './models/Schedule.js';
import { setMockMode, getMockMode, mockUsers, mockSchedules } from './utils/mockMode.js';
import { seedDemoBookings } from './scripts/seedDemoBookings.js';
import { seedModernBarber } from './scripts/seedModernBarber.js';

const app = express();
const PORT = Number(process.env.PORT) || 5050;

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

/**
 * ROBUST SEEDING LOGIC
 * Ensures Barber exists before seeding bookings to avoid '_id' errors.
 */
const performSystemSeeding = async () => {
  try {
    console.log('🏗️ Starting System Seeding...');

    // 1. Seed/Verify Barber with comprehensive data (services, gallery, testimonials, social handles)
    const barber = await seedModernBarber();
    if (barber) {
      console.log('🏠 THE MODERN BARBER SEEDED | barber@nile.ng');
    }

    // 2. Seed/Verify Admin
    const admin = await User.findOne({ email: 'admin@nile.ng' });
    if (!admin) {
      await User.create({
        email: 'admin@nile.ng',
        password: 'alphaadmin2026',
        name: 'Nile Admin',
        role: 'admin',
        businessName: 'Nile Booking',
        phone: '+234 812 384 3076',
      });
      console.log('✅ ADMIN SEEDED | admin@nile.ng');
    }

    // 3. Seed Demo Bookings (Pass the barber ID explicitly to avoid undefined)
    await seedDemoBookings(barber._id);
    console.log('✅ TOTAL SYSTEM SEED COMPLETE');

  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  }
};

/**
 * DATABASE INITIALIZATION
 * Prioritizes Local DB if Atlas fails.
 */
const initializeDatabase = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/nile_booking_dev';
  const atlasUri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(atlasUri || localUri);
    console.log(`🏠 DATABASE CONNECTED: ${conn.connection.host}`);
    
    // Trigger Seeding only after successful connection
    await performSystemSeeding();
  } catch (error) {
    console.error('❌ DB Connection Failed. Falling back to Local...');
    try {
      await mongoose.connect(localUri);
      console.log('🏠 LOCAL DB CONNECTED');
      await performSystemSeeding();
    } catch (localError) {
      console.error('❌ All DB Connections failed. Enabling MOCK MODE.');
      setMockMode(true);
    }
  }
};

// Start server only after initialization is complete.
const startServer = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Initialization error. Enabling MOCK MODE.');
    setMockMode(true);
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
