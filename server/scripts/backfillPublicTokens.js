/**
 * Public booking token backfill planner.
 *
 * Default mode is read-only. `--apply` writes only to records that have no
 * usable token and requires CONFIRM_TOKEN_BACKFILL=YES. This script is not run
 * by CI, the server, or any deploy hook.
 */
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const APPLY = process.argv.includes('--apply');
const PLAN_ONLY = process.argv.includes('--plan');
const MISSING_TOKEN = {
  $or: [
    { publicToken: { $exists: false } },
    { publicToken: null },
    { publicToken: '' },
  ],
};

const printPlan = () => {
  console.log(`
PUBLIC TOKEN BACKFILL PLAN (no writes)
1. Confirm JWT_SECRET and ADMIN_MASTER_KEY exist in production and preview.
2. Confirm the sparse unique index on bookings.publicToken exists.
3. Print this plan:              npm run tokens:plan
4. Count without writing:       npm run tokens:dry-run
5. Review counts and take a database backup or snapshot.
6. Apply only with approval:    CONFIRM_TOKEN_BACKFILL=YES npm run tokens:backfill

Scope: bookings where publicToken is missing, null, or empty.
Never overwrites an existing token. Resumable. Tokens are 64 hex characters.
`);
};

const main = async () => {
  printPlan();
  if (PLAN_ONLY) return;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Refusing to guess a target database.');
  }
  if (APPLY && process.env.CONFIRM_TOKEN_BACKFILL !== 'YES') {
    throw new Error('Refusing to write. Set CONFIRM_TOKEN_BACKFILL=YES after plan review and approval.');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  const bookings = db.collection('bookings');
  const total = await bookings.countDocuments({});
  const missing = await bookings.countDocuments(MISSING_TOKEN);
  const existing = total - missing;

  console.log(`Target database: ${db.databaseName}`);
  console.log(`Total bookings:  ${total}`);
  console.log(`Existing tokens: ${existing}`);
  console.log(`Missing tokens:  ${missing}`);
  console.log(`Mode:            ${APPLY ? 'APPLY' : 'DRY RUN (read-only)'}`);

  if (!APPLY) {
    console.log('No records were modified.');
    return;
  }

  let updated = 0;
  let failed = 0;
  const cursor = bookings.find(MISSING_TOKEN, { projection: { _id: 1 } });

  for await (const booking of cursor) {
    const publicToken = crypto.randomBytes(32).toString('hex');
    const result = await bookings.updateOne(
      { _id: booking._id, ...MISSING_TOKEN },
      { $set: { publicToken } }
    );
    if (result.modifiedCount === 1) {
      updated += 1;
    } else {
      failed += 1;
    }
  }

  console.log(`Updated: ${updated}`);
  console.log(`Skipped or failed: ${failed}`);
  console.log('Backfill complete. No customer notification was sent.');
};

main()
  .catch((error) => {
    console.error(`Backfill plan failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
