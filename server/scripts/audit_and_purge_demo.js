import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/oyekunle/Documents/nilebooking/server/.env' });

import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';

async function auditDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas for Audit.');

  const demoEmails = ['barber@nile.ng', 'admin@nile.ng'];
  const demoSlugs = ['the-modern-barber', 'nile-admin', 'sample-provider'];
  const demoNames = ['The Modern Barber', 'Modem Baba', 'Modern Baba'];

  const demoUsers = await User.find({
    $or: [
      { email: { $in: demoEmails } },
      { slug: { $in: demoSlugs } },
      { name: { $in: demoNames } },
      { businessName: { $in: demoNames } }
    ]
  });

  console.log(`Found ${demoUsers.length} demo user records.`);
  demoUsers.forEach(u => console.log(`- Demo User: ID=${u._id}, Email=${u.email}, BusinessName=${u.businessName}, Slug=${u.slug}`));

  const demoUserIds = demoUsers.map(u => u._id);

  const demoServices = await Service.find({
    $or: [
      { provider: { $in: demoUserIds } },
      { name: { $regex: /Skin Fade/i } }
    ]
  });
  console.log(`Found ${demoServices.length} demo services.`);

  const demoBookings = await Booking.find({
    $or: [
      { provider: { $in: demoUserIds } },
      { bookingNumber: { $regex: /^BK-DEMO-|^NB-DEMO-/i } }
    ]
  });
  console.log(`Found ${demoBookings.length} demo bookings.`);

  // Purge demo records safely
  if (demoUserIds.length > 0) {
    await Booking.deleteMany({ provider: { $in: demoUserIds } });
    await Service.deleteMany({ provider: { $in: demoUserIds } });
    await Schedule.deleteMany({ provider: { $in: demoUserIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });
    console.log('✅ Demo records successfully purged from production database.');
  }

  // Check remaining real users to make sure their fields are clean
  const realUsers = await User.find({ email: { $nin: demoEmails } });
  console.log(`\nReal merchant accounts in DB: ${realUsers.length}`);
  realUsers.forEach(u => {
    console.log(`- Real Merchant: ID=${u._id}, Name=${u.name}, Email=${u.email}, Business=${u.businessName}, Slug=${u.slug}`);
  });

  process.exit(0);
}

auditDatabase().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
