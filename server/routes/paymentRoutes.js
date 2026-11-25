import express from 'express';
import {
  verifyPaystackPayment,
  paystackWebhook,
  verifyFlutterwavePayment,
  flutterwaveWebhook,
  getBanks,
  verifyBankAccount,
  getTransactions,
  verifyManualPayment,
  verifyBookingPaymentController,
  processRefund,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Paystack routes
router.post('/paystack/verify', verifyPaystackPayment);
// The app-level JSON parser preserves req.rawBody for signature verification.
router.post('/paystack/webhook', paystackWebhook);

// Flutterwave routes
router.post('/flutterwave/verify', verifyFlutterwavePayment);
router.post('/flutterwave/webhook', flutterwaveWebhook);

// Bank account routes
router.get('/banks', protect, getBanks);
router.post('/verify-bank', protect, verifyBankAccount);
router.get('/transactions', protect, getTransactions);
router.put('/transactions/:id/verify', protect, verifyManualPayment);
router.put('/bookings/:bookingId/verify', protect, verifyBookingPaymentController);
router.post('/transactions/:id/refund', protect, processRefund);

export default router;
