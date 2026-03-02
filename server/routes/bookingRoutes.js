import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats,
} from '../controllers/bookingController.js';
import { protect, providerOnly } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.post('/', createBooking);

// Provider routes
router.get('/', protect, providerOnly, getBookings);
router.get('/stats', protect, providerOnly, getBookingStats);
router.get('/:id', protect, providerOnly, getBooking);
router.put('/:id/status', protect, providerOnly, updateBookingStatus);

export default router;
