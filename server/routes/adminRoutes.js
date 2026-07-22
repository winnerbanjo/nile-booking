import express from 'express';
import { getAdminStats, getPendingVerifications, verifyReceipt, getProviders, updateProviderStatus } from '../controllers/adminController.js';

const router = express.Router();

// Admin stats route
router.get('/stats', getAdminStats);

// Receipt verification routes
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:bookingId/verify', verifyReceipt);

// Provider management routes
router.get('/providers', getProviders);
router.put('/providers/:providerId/status', updateProviderStatus);

export default router;
