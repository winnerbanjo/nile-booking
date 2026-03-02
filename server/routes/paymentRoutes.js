import express from 'express';
import {
  verifyPaystackPayment,
  paystackWebhook,
  verifyFlutterwavePayment,
  flutterwaveWebhook,
  getBanks,
  verifyBankAccount,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Paystack routes
router.post('/paystack/verify', verifyPaystackPayment);
router.post('/paystack/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

// Flutterwave routes
router.post('/flutterwave/verify', verifyFlutterwavePayment);
router.post('/flutterwave/webhook', express.json(), flutterwaveWebhook);

// Bank account routes
router.get('/banks', protect, getBanks);
router.post('/verify-bank', protect, verifyBankAccount);

export default router;
