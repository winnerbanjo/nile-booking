import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  checkReminders,
} from '../controllers/notificationController.js';

const router = express.Router();

// Notification preferences routes
router
  .route('/preferences')
  .get(protect, getNotificationPreferences)
  .put(protect, updateNotificationPreferences);

// Reminder check route (for cron jobs)
router.post('/reminders/check', checkReminders);

export default router;
