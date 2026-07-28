import express from 'express';
import {
  getAdminStats,
  getPendingVerifications,
  verifyReceipt,
  getProviders,
  updateProviderStatus,
  getAdminBookings,
  getAdminCustomers,
  getAdminTransactions,
  getAdminPayouts,
  getAdminRefunds,
  getAdminSettings,
  getAdminRisk,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect, adminOnly);

// Dashboard / Stats
router.get('/stats', getAdminStats);

// Receipt verification routes
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:bookingId/verify', verifyReceipt);

// Provider management routes
router.get('/providers', getProviders);
router.put('/providers/:providerId/status', updateProviderStatus);

// Resource listing routes
router.get('/bookings', getAdminBookings);
router.get('/customers', getAdminCustomers);
router.get('/transactions', getAdminTransactions);
router.get('/payouts', getAdminPayouts);
router.get('/refunds', getAdminRefunds);
router.get('/settings', getAdminSettings);
router.get('/risk', getAdminRisk);

export default router;
