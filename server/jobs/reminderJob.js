/**
 * Reminder Job
 * This file sets up a cron job to check and send 24-hour reminders
 * 
 * To use this in production:
 * 1. Install node-cron: npm install node-cron
 * 2. Import and start the job in server.js
 * 3. Or use a service like EasyCron to hit the /api/notifications/reminders/check endpoint
 */

import cron from 'node-cron';
import { scheduleReminders } from '../services/notificationService.js';

/**
 * Run reminder check every hour
 * This ensures we catch bookings that are 23-25 hours away
 */
export const startReminderJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('\n⏰ Running scheduled reminder check...');
    try {
      const result = await scheduleReminders();
      console.log(`✅ Reminder check completed. Sent ${result.remindersSent || 0} reminders.`);
    } catch (error) {
      console.error('❌ Reminder job error:', error);
    }
  });

  console.log('✅ Reminder job started. Checking every hour for 24-hour reminders.');
};

/**
 * Alternative: Use a simple interval for development
 * This runs every 5 minutes for testing
 */
export const startReminderJobDev = () => {
  setInterval(async () => {
    console.log('\n⏰ Running reminder check (dev mode)...');
    try {
      const result = await scheduleReminders();
      console.log(`✅ Reminder check completed. Sent ${result.remindersSent || 0} reminders.`);
    } catch (error) {
      console.error('❌ Reminder job error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✅ Reminder job started (dev mode). Checking every 5 minutes.');
};
