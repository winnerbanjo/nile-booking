import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import CustomDomain from '../models/CustomDomain.js';
import {
  isWithinRenewalReminderWindow,
  runDomainExpiryReminders,
} from '../services/domain/domainService.js';

const DAY = 24 * 60 * 60 * 1000;

let mongod;

const createMerchant = () =>
  User.create({
    name: 'Reminder Merchant',
    email: `reminder-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: 'test-password-123',
    role: 'provider',
    businessName: 'Reminder Studio',
    slug: `reminder-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });

const createDomain = (merchant, { domain, expiryDate, status = 'ACTIVE', active = true }) =>
  CustomDomain.create({
    merchant: merchant._id,
    domain,
    source: 'purchased',
    status,
    active,
    registration: {
      registeredAt: new Date(Date.now() - 300 * DAY),
      expiryDate,
      autoRenew: false,
    },
  });

describe('Domain expiry reminders', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.createIndexes(), CustomDomain.createIndexes()]);
    delete process.env.MAILTRAP_TOKEN;
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), CustomDomain.deleteMany({})]);
  });

  it('only considers domains inside the final seven days', () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    expect(isWithinRenewalReminderWindow(new Date(now.getTime() + 7 * DAY), now)).toBe(true);
    expect(isWithinRenewalReminderWindow(new Date(now.getTime() + 7 * DAY + 1000), now)).toBe(false);
    expect(isWithinRenewalReminderWindow(new Date(now.getTime() - 1000), now)).toBe(false);
  });

  it('sends one reminder, records delivery, and does not send it again', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();

    const due = await createDomain(merchant, {
      domain: 'due-soon.store',
      expiryDate: new Date(now.getTime() + 6 * DAY),
    });
    const later = await createDomain(merchant, {
      domain: 'later.store',
      expiryDate: new Date(now.getTime() + 8 * DAY),
      status: 'REGISTERED',
      active: false,
    });
    const expired = await createDomain(merchant, {
      domain: 'expired.store',
      expiryDate: new Date(now.getTime() - DAY),
      status: 'REGISTERED',
      active: false,
    });

    const first = await runDomainExpiryReminders({ now });
    expect(first).toMatchObject({ scanned: 1, sent: 1, failed: 0 });

    const refreshed = await CustomDomain.findById(due._id).lean();
    expect(refreshed.renewal.expiryReminderStatus).toBe('sent');
    expect(refreshed.renewal.expiryReminderAttempts).toBe(1);
    expect(refreshed.renewal.expiryReminderSentAt).toBeInstanceOf(Date);

    expect((await CustomDomain.findById(later._id).lean()).renewal.expiryReminderStatus).toBe('idle');
    expect((await CustomDomain.findById(expired._id).lean()).renewal.expiryReminderStatus).toBe('idle');

    const second = await runDomainExpiryReminders({ now: new Date(now.getTime() + 60 * 1000) });
    expect(second).toMatchObject({ scanned: 0, sent: 0, failed: 0 });

    const afterSecondRun = await CustomDomain.findById(due._id).lean();
    expect(afterSecondRun.renewal.expiryReminderAttempts).toBe(1);
  });

  it('claims a due domain once when reminder runs overlap', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();
    await createDomain(merchant, {
      domain: 'overlap.store',
      expiryDate: new Date(now.getTime() + 5 * DAY),
    });

    let deliveryCount = 0;
    const sendReminder = async () => {
      deliveryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { success: true };
    };

    const results = await Promise.all([
      runDomainExpiryReminders({ now, sendReminder }),
      runDomainExpiryReminders({ now, sendReminder }),
    ]);

    expect(deliveryCount).toBe(1);
    expect(results.reduce((sent, result) => sent + result.sent, 0)).toBe(1);
    expect(await CustomDomain.countDocuments({ 'renewal.expiryReminderStatus': 'sent' })).toBe(1);
  });

  it('does not overwrite reminder state when a renewal happens during email delivery', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();
    const domain = await createDomain(merchant, {
      domain: 'renewed-during-reminder.store',
      expiryDate: new Date(now.getTime() + 5 * DAY),
    });
    const renewedExpiry = new Date(now.getTime() + 365 * DAY);

    const result = await runDomainExpiryReminders({
      now,
      sendReminder: async () => {
        await CustomDomain.updateOne(
          { _id: domain._id },
          {
            $set: {
              'registration.expiryDate': renewedExpiry,
              'renewal.expiryReminderStatus': 'idle',
              'renewal.expiryReminderSentAt': null,
              'renewal.expiryReminderLastAttemptAt': null,
              'renewal.expiryReminderLeaseUntil': null,
              'renewal.expiryReminderClaimId': null,
              'renewal.expiryReminderAttempts': 0,
            },
          }
        );
        return { success: true };
      },
    });

    expect(result).toMatchObject({ scanned: 1, sent: 0, failed: 0 });
    const refreshed = await CustomDomain.findById(domain._id).lean();
    expect(refreshed.registration.expiryDate).toEqual(renewedExpiry);
    expect(refreshed.renewal.expiryReminderStatus).toBe('idle');
    expect(refreshed.renewal.expiryReminderClaimId).toBeNull();
    expect(refreshed.renewal.expiryReminderAttempts).toBe(0);
  });

  it('exposes domain maintenance through a cron-secret protected GET route', async () => {
    process.env.MONGODB_URI = mongod.getUri();
    const { default: app } = await import('../app.js');

    const blocked = await request(app).get('/api/domains/cron/maintenance');
    expect(blocked.status).toBe(401);

    const response = await request(app)
      .get('/api/domains/cron/maintenance')
      .set('authorization', `Bearer ${process.env.CRON_SECRET}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
  });

  it('exposes the daily job through a cron-secret protected GET route', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();
    await createDomain(merchant, {
      domain: 'route-check.store',
      expiryDate: new Date(now.getTime() + 6 * DAY),
    });

    process.env.MONGODB_URI = mongod.getUri();
    const { default: app } = await import('../app.js');

    const blocked = await request(app).get('/api/domains/cron/renewal-reminders');
    expect(blocked.status).toBe(401);

    const response = await request(app)
      .get('/api/domains/cron/renewal-reminders')
      .set('x-cron-secret', process.env.CRON_SECRET);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, sent: 1, failed: 0 });
  });

  it('keeps failed delivery retryable only after the six-hour backoff', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();
    const domain = await createDomain(merchant, {
      domain: 'delivery-failure.store',
      expiryDate: new Date(now.getTime() + 5 * DAY),
    });

    const failed = await runDomainExpiryReminders({
      now,
      sendReminder: async () => ({ success: false, error: 'mail provider unavailable' }),
    });
    expect(failed).toMatchObject({ scanned: 1, sent: 0, failed: 1 });
    expect((await CustomDomain.findById(domain._id).lean()).renewal.expiryReminderStatus).toBe('failed');

    const beforeBackoff = await runDomainExpiryReminders({
      now: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      sendReminder: async () => ({ success: true }),
    });
    expect(beforeBackoff).toMatchObject({ scanned: 0, sent: 0, failed: 0 });

    const afterBackoff = await runDomainExpiryReminders({
      now: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      sendReminder: async () => ({ success: true }),
    });
    expect(afterBackoff).toMatchObject({ scanned: 1, sent: 1, failed: 0 });
  });

  it('retries a failed reminder after the retry backoff', async () => {
    const now = new Date('2026-11-24T08:00:00.000Z');
    const merchant = await createMerchant();
    const domain = await createDomain(merchant, {
      domain: 'retry.store',
      expiryDate: new Date(now.getTime() + 5 * DAY),
    });

    await CustomDomain.updateOne(
      { _id: domain._id },
      {
        $set: {
          'renewal.expiryReminderStatus': 'failed',
          'renewal.expiryReminderLastAttemptAt': new Date(now.getTime() - 7 * 60 * 60 * 1000),
          'renewal.expiryReminderError': 'temporary provider failure',
        },
      }
    );

    const result = await runDomainExpiryReminders({ now });
    expect(result).toMatchObject({ scanned: 1, sent: 1, failed: 0 });

    const refreshed = await CustomDomain.findById(domain._id).lean();
    expect(refreshed.renewal.expiryReminderStatus).toBe('sent');
    expect(refreshed.renewal.expiryReminderError).toBeNull();
  });
});
