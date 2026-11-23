import express from 'express';
import {
  createBooking,
  getPublicBooking,
  uploadPublicReceipt,
  cancelPublicBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats,
} from '../controllers/bookingController.js';
import { protect, providerOnly } from '../middleware/auth.js';
import { rateLimit, getClientIp, providerKey } from '../middleware/rateLimit.js';

const router = express.Router();

const createByIp = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `booking-ip:${getClientIp(req)}`,
  message: 'Too many booking attempts from this connection.',
});
const createByProvider = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => `booking-provider:${providerKey(req)}`,
  message: 'This business is receiving too many booking attempts. Please retry shortly.',
});
const tokenUploadByIp = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `receipt-ip:${getClientIp(req)}`,
  message: 'Too many receipt upload attempts.',
});
const tokenUploadByToken = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `receipt-token:${req.params.token}`,
  message: 'Too many receipt upload attempts for this booking.',
});
const tokenCancelByIp = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `cancel-ip:${getClientIp(req)}`,
  message: 'Too many cancellation attempts.',
});

// Public routes. The 64-character token is the only lookup key for the portal;
// a booking number alone never reaches these handlers.
router.post('/', createByIp, createByProvider, createBooking);
router.get('/public/:token', getPublicBooking);
router.post('/public/:token/receipt', tokenUploadByIp, tokenUploadByToken, uploadPublicReceipt);
router.post('/public/:token/cancel', tokenCancelByIp, cancelPublicBooking);

// Provider routes
router.get('/', protect, providerOnly, getBookings);
router.get('/stats', protect, providerOnly, getBookingStats);
router.get('/:id', protect, providerOnly, getBooking);
router.put('/:id/status', protect, providerOnly, updateBookingStatus);

export default router;
