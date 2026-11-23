import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { getMockMode } from './utils/mockMode.js';
import { correlationMiddleware, logEvent } from './utils/logger.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import domainRoutes from './routes/domainRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(correlationMiddleware);

// CORS: explicit allowlist only. No *.vercel.app or local-network wildcards.
const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const configuredOrigins = parseOrigins(process.env.CORS_ORIGINS);
const localOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(isProduction ? [] : localOrigins),
]);

if (isProduction && configuredOrigins.length === 0) {
  console.warn('CORS_ORIGINS is empty; cross-origin browser requests will be rejected.');
}

const corsOptions = {
  origin: function (origin, callback) {
    // Native/server-to-server requests have no Origin header.
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalized)) {
      return callback(null, true);
    }

    if (!isProduction && /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(normalized)) {
      return callback(null, true);
    }

    // No CORS headers for unlisted origins. The browser fails the request
    // safely; this is not an application 500.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-cron-secret', 'x-correlation-id'],
  exposedHeaders: ['Idempotency-Key', 'Retry-After', 'x-correlation-id'],
};

app.use(cors(corsOptions));

// Terminate every preflight before the database middleware. Allowed origins
// have CORS headers from the middleware above; unlisted origins do not.
app.options('*', (req, res) => res.sendStatus(204));

// Normal JSON stays small. Only the token-gated public receipt endpoint gets
// enough room for a validated 5 MB binary encoded as base64.
const receiptUploadPath = /^\/api\/bookings\/public\/[a-f0-9]{64}\/receipt$/i;
const paymentWebhookPath = /^\/api\/payments\/(?:paystack|flutterwave)\/webhook$/i;
const defaultJsonParser = express.json({
  limit: process.env.JSON_BODY_LIMIT || '1mb',
  // Payment signatures cover the exact bytes sent by the gateway, not a
  // re-serialized object. Preserve those bytes for webhook verification.
  verify: (req, res, buf) => {
    if (paymentWebhookPath.test(req.path)) {
      req.rawBody = buf;
    }
  },
});
const receiptJsonParser = express.json({
  limit: process.env.RECEIPT_BODY_LIMIT || '7mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
});

app.use((req, res, next) => {
  const parser = req.method === 'POST' && receiptUploadPath.test(req.path)
    ? receiptJsonParser
    : defaultJsonParser;
  return parser(req, res, next);
});
app.use(express.urlencoded({ limit: process.env.URLENCODED_BODY_LIMIT || '1mb', extended: true }));

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);

// Health must test Mongo, not just process liveness. It is registered before
// the general DB middleware so a database outage returns 503, not a generic 500.
app.get('/api/health', async (req, res) => {
  const startedAt = Date.now();
  try {
    if (getMockMode()) {
      return res.json({
        status: 'ok',
        service: 'Nile Booking API Engine (mock mode)',
        database: 'mock',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }

    await withTimeout(connectDB(), 5000, 'Database connection timed out');
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw new Error('MongoDB is not connected');
    }
    await withTimeout(mongoose.connection.db.admin().ping(), 3000, 'MongoDB ping timed out');

    return res.json({
      status: 'ok',
      service: 'Nile Booking API Engine (Vercel Serverless)',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logEvent('health_check_failed', {
      correlationId: req.correlationId,
      error: error.message,
      latencyMs: Date.now() - startedAt,
    });
    return res.status(503).json({
      status: 'unavailable',
      database: 'down',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(async (req, res, next) => {
  try {
    if (!getMockMode()) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error(JSON.stringify({
      event: 'database_connection_error',
      correlationId: req.correlationId,
      error: error.message,
    }));
    res.status(503).json({
      message: 'Database connection error',
      correlationId: req.correlationId,
    });
  }
});

// API Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/service-categories', categoryRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    correlationId: req.correlationId,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logEvent('unhandled_request_error', {
    correlationId: req.correlationId,
    error: err.message,
    path: req.originalUrl?.split('?')[0],
  });
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    correlationId: req.correlationId,
  });
});

export default app;
