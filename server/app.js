import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { getMockMode } from './utils/mockMode.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

// Middleware - CORS Configuration for Production & Dynamic Subdomains
const allowedOrigins = [
  "https://nilebooking.co",
  "https://www.nilebooking.co",
  "https://app.nilebooking.co",
  "https://api.nilebooking.co",
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
  allowedHeaders: ["Content-Type", "Authorization", "x-cron-secret"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(async (req, res, next) => {
  try {
    if (!getMockMode()) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Database connection middleware error:', error.message);
    res.status(500).json({ message: 'Database connection error', error: error.message });
  }
});

// Root Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Nile Booking API Engine (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
});

// API Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/service-categories', categoryRoutes);
app.use('/api/system', systemRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

export default app;
