import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DateTime } from 'luxon';

import User from '../models/User.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import Booking from '../models/Booking.js';
import { ensurePublicToken, runReminders, retryFailedNotifications } from '../services/notificationService.js';

jest.setTimeout(120000);

const TZ = 'Africa/Lagos';
let mongod;

const weekly = () =>
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].reduce((acc, day) => {
    acc[day] = { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] };
    return acc;
  }, {});

const providerFixture = async () => {
  const provider = await User.create({
    name: 'Reminder Barber',
    email: 'reminders-provider@example.com',
    password: 'password123',
    role: 'provider',
    businessName: 'Reminder Barber',
    slug: 'reminder-barber',
  });
  const service = await Service.create({
    provider: provider._id,
    name: 'Reminder Cut',
    description: 'Cut',
    category: 'barber',
    price: 10000,
    duration: 1,
  });
  await Schedule.create({
    provider: provider._id,
    timezone: TZ,
    bufferTime: 0,
    weeklySchedule: weekly(),
    bookingWindowDays: 60,
    minimumLeadTimeMinutes: 0,
  });
  return { provider, service };
};

const createBooking = async ({ provider, service, status, paymentStatus, startAt, holdExpiresAt, notifications }) => {
  const booking = await Booking.create({
    customer: { name: 'Reminder Customer', email: 'reminder-customer@example.com', phone: '+2348033333333' },
    provider: provider._id,
    service: service._id,
    date: startAt,
    startAt,
    endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
    timeSlot: { startTime: '09:00', endTime: '10:00' },
    status,
    paymentStatus,
    paymentType: 'full',
    paymentMethod: 'bank_transfer',
    holdExpiresAt,
    receiptImageUrl: paymentStatus === 'awaiting_verification' ? 'https://example.com/r.png' : null,
    pricing: { servicePrice: 10000, depositAmount: 10000, totalAmount: 10000, currency: 'NGN' },
    totalPrice: 10000,
    depositAmount: 10000,
    balanceDue: 10000,
    notifications,
  });
  return Booking.findById(booking._id).select('+publicToken');
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.MAILTRAP_TOKEN;
  process.env.CLIENT_URL = 'https://test.nilebooking.local';
  process.env.HOLD_REMINDER_LEAD_MINUTES = '15';
  process.env.APPOINTMENT_REMINDER_LEAD_MINUTES = '1440';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Booking.createIndexes(), Service.createIndexes(), User.createIndexes()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Booking.deleteMany({}),
    Service.deleteMany({}),
    Schedule.deleteMany({}),
    User.deleteMany({}),
  ]);
});

describe('Legacy token assignment', () => {
  it('adds a durable token to a booking that predates the field', async () => {
    const { provider, service } = await providerFixture();
    const booking = await createBooking({
      provider,
      service,
      status: 'pending',
      paymentStatus: 'awaiting_payment',
      startAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      holdExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await Booking.collection.updateOne({ _id: booking._id }, { $unset: { publicToken: 1 } });
    const legacy = await Booking.findById(booking._id).select('+publicToken');
    expect(legacy.publicToken).toBeUndefined();

    const token = await ensurePublicToken(legacy);
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const stored = await Booking.findById(booking._id).select('+publicToken').lean();
    expect(stored.publicToken).toBe(token);
  });
});

describe('Reminder delivery', () => {
  it('sends each hold and appointment reminder once, then records sentAt', async () => {
    const { provider, service } = await providerFixture();
    const now = new Date();
    const holdBooking = await createBooking({
      provider,
      service,
      status: 'pending',
      paymentStatus: 'awaiting_payment',
      startAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      holdExpiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });
    const appointmentBooking = await createBooking({
      provider,
      service,
      status: 'confirmed',
      paymentStatus: 'confirmed',
      startAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      holdExpiresAt: null,
    });

    const first = await runReminders({ now });
    expect(first.unpaidHoldSent).toBe(1);
    expect(first.appointmentSent).toBe(1);

    const second = await runReminders({ now });
    expect(second.unpaidHoldSent).toBe(0);
    expect(second.appointmentSent).toBe(0);

    const holdAfter = await Booking.findById(holdBooking._id).lean();
    const appointmentAfter = await Booking.findById(appointmentBooking._id).lean();
    expect(holdAfter.reminders.unpaidHold.status).toBe('sent');
    expect(holdAfter.reminders.unpaidHold.sentAt).toBeTruthy();
    expect(holdAfter.reminders.unpaidHold.attempts).toBe(1);
    expect(appointmentAfter.reminders.appointment.status).toBe('sent');
    expect(appointmentAfter.reminders.appointment.sentAt).toBeTruthy();
  });

  it('does not send a hold reminder after the hold has expired', async () => {
    const { provider, service } = await providerFixture();
    const now = new Date();
    await createBooking({
      provider,
      service,
      status: 'pending',
      paymentStatus: 'awaiting_payment',
      startAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      holdExpiresAt: new Date(now.getTime() - 60 * 1000),
    });

    const result = await runReminders({ now });
    expect(result.unpaidHoldSent).toBe(0);
  });

  it('retries a failed booking-received email and records the attempt', async () => {
    const { provider, service } = await providerFixture();
    const booking = await createBooking({
      provider,
      service,
      status: 'pending',
      paymentStatus: 'awaiting_payment',
      startAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      holdExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      notifications: {
        bookingReceivedCustomer: {
          status: 'failed',
          attempts: 1,
          lastAttemptAt: new Date(),
          error: 'previous failure',
        },
      },
    });

    const result = await retryFailedNotifications();
    expect(result.attempted).toBeGreaterThanOrEqual(1);
    expect(result.sent).toBeGreaterThanOrEqual(1);

    const updated = await Booking.findById(booking._id).lean();
    expect(updated.notifications.bookingReceivedCustomer.status).toBe('sent');
    expect(updated.notifications.bookingReceivedCustomer.attempts).toBe(2);
    expect(updated.notifications.bookingReceivedCustomer.error).toBeNull();
  });
});
