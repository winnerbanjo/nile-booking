import express from 'express';
import { getAdminStats, getPendingVerifications, verifyReceipt } from '../controllers/adminController.js';

const router = express.Router();

// Admin stats route
router.get('/stats', getAdminStats);

// Receipt verification routes
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:bookingId/verify', verifyReceipt);

export default router;
