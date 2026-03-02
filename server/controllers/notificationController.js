import User from '../models/User.js';
import { scheduleReminders } from '../services/notificationService.js';

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private (Provider)
export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      preferences: user.notificationPreferences || {
        whatsappEnabled: true,
        emailEnabled: true,
        whatsappReminders: true,
        emailReceipts: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private (Provider)
export const updateNotificationPreferences = async (req, res) => {
  try {
    const {
      whatsappEnabled,
      emailEnabled,
      whatsappReminders,
      emailReceipts,
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationPreferences = {
      whatsappEnabled: whatsappEnabled !== undefined ? whatsappEnabled : user.notificationPreferences?.whatsappEnabled ?? true,
      emailEnabled: emailEnabled !== undefined ? emailEnabled : user.notificationPreferences?.emailEnabled ?? true,
      whatsappReminders: whatsappReminders !== undefined ? whatsappReminders : user.notificationPreferences?.whatsappReminders ?? true,
      emailReceipts: emailReceipts !== undefined ? emailReceipts : user.notificationPreferences?.emailReceipts ?? true,
    };

    await user.save();

    res.json({
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Trigger reminder check (for cron jobs)
// @route   POST /api/notifications/reminders/check
// @access  Private (Admin) or via cron secret
export const checkReminders = async (req, res) => {
  try {
    // Verify cron secret if provided
    const cronSecret = req.headers['x-cron-secret'];
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await scheduleReminders();
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
