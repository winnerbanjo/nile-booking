import express from 'express';
import {
  getSchedule,
  updateSchedule,
  getScheduleBySlug,
} from '../controllers/scheduleController.js';
import { protect, providerOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, providerOnly, getSchedule);
router.put('/', protect, providerOnly, updateSchedule);
router.get('/provider/:slug', getScheduleBySlug);

export default router;
