import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DateTime } from 'luxon';
import { v2 as cloudinary } from 'cloudinary';

import User from '../models/User.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import Booking from '../models/Booking.js';
import SlotClaim from '../models/SlotClaim.js';
import Transaction from '../models/Transaction.js';
import bookingRoutes from '../routes/bookingRoutes.js';
import { resetRateLimitsForTests } from '../middleware/rateLimit.js';

jest.setTimeout(120000);

const TZ = 'Africa/Lagos';
let mongod;
let app;
let uploadSpy;

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const weekly = () =>
  ALL_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] };
    return acc;
  }, {});

const futureStart = () =>
  DateTime.now().setZone(TZ).plus({ days: 3 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });

const makeProvider = async () => {
  const provider = await User.create({
    name: 'Portal Barber',
    email: 'portal-provider@example.com',
    password: 'password123',
    role: 'provider',
    businessName: 'Portal Barber',
    slug: 'portal-barber',
    phone: '+2348011111111',
    bankAccount: {
      bankName: '044',
      accountName: 'Portal Barber Ltd',
      accountNumber: '0123456789',
    },
  });
  const service = await Service.create({
    provider: provider._id,
    name: 'Portal Cut',
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

const createViaApi = async (service, overrides = {}) => {
  const start = futureStart().toUTC().toISO();
  const response = await request(app)
    .post('/api/bookings')
    .send({
      customer: { name: 'Portal Customer', email: 'portal-customer@example.com', phone: '+2348022222222' },
      serviceId: service._id.toString(),
      providerSlug: 'portal-barber',
      startAt: start,
      paymentType: 'full',
      ...overrides,
    });
  return response;
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.HOLD_MINUTES = '30';
  process.env.CASH_HOLD_HOURS = '24';
  process.env.CLIENT_URL = 'https://test.nilebooking.local';
  delete process.env.MAILTRAP_TOKEN;

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    Booking.createIndexes(),
    SlotClaim.createIndexes(),
    Service.createIndexes(),
    User.createIndexes(),
  ]);

  app = express();
  app.use(express.json({ limit: '7mb' }));
  app.use('/api/bookings', bookingRoutes);

  uploadSpy = jest.spyOn(cloudinary.uploader, 'upload').mockResolvedValue({
    secure_url: 'https://example.com/receipt.png',
    public_id: 'receipt-test',
  });
});

afterAll(async () => {
  uploadSpy?.mockRestore();
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  resetRateLimitsForTests();
  uploadSpy.mockClear();
  await Promise.all([
    Booking.deleteMany({}),
    SlotClaim.deleteMany({}),
    Service.deleteMany({}),
    Schedule.deleteMany({}),
    Transaction.deleteMany({}),
    User.deleteMany({}),
  ]);
});

describe('Token-gated booking portal', () => {
  it('creates a booking with a long token and returns payment information only through that token', async () => {
    const { service } = await makeProvider();
    const created = await createViaApi(service);

    expect(created.statusCode).toBe(201);
    expect(created.body.portalUrl).toMatch(/^https:\/\/test\.nilebooking\.local\/bookings\/[a-f0-9]{64}$/);

    const stored = await Booking.findById(created.body.booking._id).select('+publicToken').lean();
    expect(stored.publicToken).toHaveLength(64);
    expect(created.body.booking.publicToken).toBeUndefined();

    const portal = await request(app).get(`/api/bookings/public/${stored.publicToken}`);
    expect(portal.statusCode).toBe(200);
    expect(portal.body.booking.reference).toBe(stored.bookingNumber);
    expect(portal.body.booking.bankDetails.accountNumber).toBe('0123456789');
    expect(portal.body.booking.customer).toBeUndefined();

    const guessedNumber = await request(app).get(`/api/bookings/public/${stored.bookingNumber}`);
    expect(guessedNumber.statusCode).toBe(404);
    expect(guessedNumber.body.booking).toBeUndefined();
  });

  it('does not offer receipt upload or bank details for a pay-later booking', async () => {
    const { service } = await makeProvider();
    const created = await createViaApi(service, { paymentType: 'pay_later' });
    expect(created.statusCode).toBe(201);

    const stored = await Booking.findById(created.body.booking._id).select('+publicToken').lean();
    const portal = await request(app).get(`/api/bookings/public/${stored.publicToken}`);

    expect(portal.statusCode).toBe(200);
    expect(portal.body.booking.paymentMethod).toBe('pay_later');
    expect(portal.body.booking.bankDetails).toBeNull();
    expect(portal.body.booking.canUploadReceipt).toBe(false);
  });

  it('accepts a later receipt, clears the hold, and leaves the claim in place', async () => {
    const { service } = await makeProvider();
    const created = await createViaApi(service);
    const stored = await Booking.findById(created.body.booking._id).select('+publicToken');

    const response = await request(app)
      .post(`/api/bookings/public/${stored.publicToken}/receipt`)
      .send({
        receiptImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.paymentStatus).toBe('awaiting_verification');

    const updated = await Booking.findById(stored._id).lean();
    expect(updated.receiptImageUrl).toBe('https://example.com/receipt.png');
    expect(updated.paymentStatus).toBe('awaiting_verification');
    expect(updated.holdExpiresAt).toBeNull();

    const claims = await SlotClaim.find({ booking: stored._id }).lean();
    expect(claims.length).toBeGreaterThan(0);
    expect(claims.every((claim) => claim.expiresAt === null)).toBe(true);
  });

  it('cancels through the existing transition, releases the slot, and notifies the provider', async () => {
    const { service } = await makeProvider();
    const created = await createViaApi(service);
    const stored = await Booking.findById(created.body.booking._id).select('+publicToken');

    const response = await request(app)
      .post(`/api/bookings/public/${stored.publicToken}/cancel`)
      .send({ reason: 'Plans changed' });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('cancelled');

    const updated = await Booking.findById(stored._id).lean();
    expect(updated.paymentStatus).toBe('cancelled');
    expect(await SlotClaim.countDocuments({ booking: stored._id })).toBe(0);
    expect(updated.notifications.cancellationProvider.status).toBe('sent');
    expect(updated.notifications.cancellationCustomer.status).toBe('sent');
  });

  it('rejects a receipt with an unsupported type before upload', async () => {
    const { service } = await makeProvider();
    const created = await createViaApi(service);
    const stored = await Booking.findById(created.body.booking._id).select('+publicToken');

    const response = await request(app)
      .post(`/api/bookings/public/${stored.publicToken}/receipt`)
      .send({ receiptImage: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' });

    expect(response.statusCode).toBe(422);
    expect(response.body.code).toBe('INVALID_RECEIPT');
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
