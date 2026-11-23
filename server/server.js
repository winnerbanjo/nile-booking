import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';
import { validateRequiredSecrets } from './config/secrets.js';

const PORT = Number(process.env.PORT) || 5050;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_DEMO_SEEDING = process.env.ENABLE_DEMO_SEEDING === 'true';
// Never purge by default. Production refuses the flag entirely.
const PURGE_DEMO_DATA = process.env.PURGE_DEMO_DATA === 'true';

if (IS_PRODUCTION && PURGE_DEMO_DATA) {
  console.error('Refusing to start: PURGE_DEMO_DATA is not permitted in production.');
  process.exit(1);
}
if (IS_PRODUCTION && ENABLE_DEMO_SEEDING) {
  console.error('Refusing to start: ENABLE_DEMO_SEEDING is not permitted in production.');
  process.exit(1);
}

try {
  validateRequiredSecrets();
} catch (error) {
  console.error(`Refusing to start: ${error.message}`);
  process.exit(1);
}

const purgeDemoData = async () => {
  const demoEmails = ['barber@nile.ng', 'admin@nile.ng'];
  const demoUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
  const demoProviderIds = demoUsers.map((user) => user._id);

  if (demoProviderIds.length > 0) {
    await Promise.all([
      Booking.deleteMany({
        $or: [
          { provider: { $in: demoProviderIds } },
          { bookingNumber: { $regex: '^NB-DEMO-' } },
        ],
      }),
      Service.deleteMany({ provider: { $in: demoProviderIds } }),
      User.deleteMany({ _id: { $in: demoProviderIds } }),
    ]);
  } else {
    await Booking.deleteMany({ bookingNumber: { $regex: '^NB-DEMO-' } });
  }

  console.log('✅ Demo data purge completed');
};

const startServer = async () => {
  try {
    await connectDB();

    if (PURGE_DEMO_DATA) {
      await purgeDemoData();
    }

    if (ENABLE_DEMO_SEEDING) {
      console.log('⚠️ Demo seeding is enabled by environment configuration');
      try {
        const { seedModernBarber } = await import('./scripts/seedModernBarber.js');
        await seedModernBarber();
      } catch (seedErr) {
        console.error('⚠️ Seeding error:', seedErr.message);
      }
    }
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`
  🚀 NILE ENGINE LIVE ON PORT ${PORT}
  🎨 LOGO: River N (Green)
  `);
  });

  // Vercel Cron is the production scheduler. This in-process fallback is only
  // for a long-lived host and must be opted into explicitly.
  if (process.env.ENABLE_IN_PROCESS_CRON === 'true') {
    const { startReminderJob } = await import('./jobs/reminderJob.js');
    startReminderJob();
  }
};

startServer();
