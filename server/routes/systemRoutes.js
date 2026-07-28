import express from 'express';
import { logFrontendError, getErrorLog } from '../controllers/systemController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/frontend-errors', logFrontendError);

// Admin-only lookup by reference ID
router.get('/frontend-errors/:referenceId', protect, adminOnly, getErrorLog);

export default router;
