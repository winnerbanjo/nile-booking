import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/oyekunle/Documents/nilebooking/server/.env' });

import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import Transaction from '../models/Transaction.js';

async function cleanupDemoData() {
  const isExecute = process.argv.includes('--execute');
  const isDryRun = !isExecute || process.argv.includes('--dry-run');

  console.log(`====================================================`);
  console.log(`   NILE BOOKING - DEMO DATA CLEANUP AUDIT ENGINE    `);
  console.log(`====================================================`);
  console.log(`Mode: ${isExecute ? '⚡ EXECUTION MODE (WILL DELETE)' : '🔍 DRY-RUN MODE (SAFE READ-ONLY)'}\n`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.\n');

  // Reliable signals for identifying demo records
  const demoEmails = ['barber@nile.ng', 'admin@nile.ng'];
  const demoSlugs = ['the-modern-barber', 'sample-provider', 'nile-admin'];
  const demoNames = ['The Modern Barber', 'Modem Baba', 'Modern Baba'];

  // Find demo users matching exact demo signals
  const demoUsers = await User.find({
    $or: [
      { email: { $in: demoEmails } },
      { email: { $regex: /@example\.com$/i } },
      { slug: { $in: demoSlugs } },
      { name: { $in: demoNames } },
      { businessName: { $in: demoNames } },
    ],
  }).lean();

  const demoUserIds = demoUsers.map((u) => u._id);

  // Find associated demo services
  const demoServices = await Service.find({
    $or: [
      { provider: { $in: demoUserIds } },
      { name: { $regex: /^Skin Fade|^Beard Trim|^Full Grooming Package/i } },
    ],
  }).lean();
  const demoServiceIds = demoServices.map((s) => s._id);

  // Find associated demo bookings
  const demoBookings = await Booking.find({
    $or: [
      { provider: { $in: demoUserIds } },
      { service: { $in: demoServiceIds } },
      { bookingNumber: { $regex: /^BK-DEMO-|^NB-DEMO-/i } },
      { 'customer.email': { $regex: /@example\.com$/i } },
    ],
  }).lean();
  const demoBookingIds = demoBookings.map((b) => b._id);

  // Find associated demo transactions
  const demoTransactions = await Transaction.find({
    $or: [
      { provider: { $in: demoUserIds } },
      { booking: { $in: demoBookingIds } },
      { customerEmail: { $regex: /@example\.com$/i } },
    ],
  }).lean();
  const demoTransactionIds = demoTransactions.map((t) => t._id);

  // Find associated demo schedules
  const demoSchedules = await Schedule.find({
    provider: { $in: demoUserIds },
  }).lean();
  const demoScheduleIds = demoSchedules.map((sc) => sc._id);

  console.log(`--- DRY-RUN AUDIT SUMMARY ---`);
  console.log(`Demo Users Found:        ${demoUsers.length}`);
  console.log(`Demo Services Found:     ${demoServices.length}`);
  console.log(`Demo Bookings Found:     ${demoBookings.length}`);
  console.log(`Demo Transactions Found: ${demoTransactions.length}`);
  console.log(`Demo Schedules Found:    ${demoSchedules.length}\n`);

  console.log(`--- DETAILED RECORD BREAKDOWN ---`);
  if (demoUsers.length === 0 && demoServices.length === 0 && demoBookings.length === 0) {
    console.log('✅ No demo records identified in production database.');
  } else {
    demoUsers.forEach((u) => {
      console.log(`[USER] ID: ${u._id} | Name: "${u.name}" | Email: ${u.email} | Reason: Known demo user/test domain | Created: ${u.createdAt}`);
    });
    demoServices.forEach((s) => {
      console.log(`[SERVICE] ID: ${s._id} | Name: "${s.name}" | Provider: ${s.provider} | Reason: Linked to demo provider/title | Created: ${s.createdAt}`);
    });
    demoBookings.forEach((b) => {
      console.log(`[BOOKING] ID: ${b._id} | Number: ${b.bookingNumber} | Customer: ${b.customer?.email} | Reason: Demo customer/provider | Created: ${b.createdAt}`);
    });
    demoTransactions.forEach((t) => {
      console.log(`[TRANSACTION] ID: ${t._id} | Ref: ${t.transactionReference} | Email: ${t.customerEmail} | Reason: Demo transaction | Created: ${t.createdAt}`);
    });
  }

  // Count remaining real production records
  const realUsers = await User.countDocuments({ _id: { $nin: demoUserIds } });
  const realBookings = await Booking.countDocuments({ _id: { $nin: demoBookingIds } });
  const realServices = await Service.countDocuments({ _id: { $nin: demoServiceIds } });
  const realTransactions = await Transaction.countDocuments({ _id: { $nin: demoTransactionIds } });

  console.log(`\n--- PRODUCTION REAL RECORD COUNTS ---`);
  console.log(`Real Users Preserved:        ${realUsers}`);
  console.log(`Real Bookings Preserved:     ${realBookings}`);
  console.log(`Real Services Preserved:     ${realServices}`);
  console.log(`Real Transactions Preserved: ${realTransactions}\n`);

  if (isExecute) {
    console.log(`⚡ Executing deletion of identified demo records...`);
    if (demoUserIds.length > 0) {
      await Booking.deleteMany({ _id: { $in: demoBookingIds } });
      await Transaction.deleteMany({ _id: { $in: demoTransactionIds } });
      await Service.deleteMany({ _id: { $in: demoServiceIds } });
      await Schedule.deleteMany({ _id: { $in: demoScheduleIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });
      console.log(`✅ Successfully deleted ${demoUsers.length} demo users and associated demo dependencies.`);
    } else {
      console.log(`ℹ️ No demo users needed deletion.`);
    }
  } else {
    console.log(`ℹ️ Dry-run completed. No records were modified or deleted.`);
    console.log(`   To execute deletion, re-run with: node scripts/cleanupDemoData.js --execute`);
  }

  process.exit(0);
}

cleanupDemoData().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
