import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DateTime } from 'luxon';

import User from '../models/User.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import Booking from '../models/Booking.js';
import SlotClaim from '../models/SlotClaim.js';
import Transaction from '../models/Transaction.js';
import availabilityRoutes from '../routes/availabilityRoutes.js';
import bookingRoutes from '../routes/bookingRoutes.js';
import { getSchedule, updateSchedule } from '../controllers/scheduleController.js';
import { updateBookingStatus } from '../controllers/bookingController.js';
import {
  claimSlot,
  computeHoldExpiresAt,
  releaseExpiredHolds,
  sweepExpiredHolds,
} from '../services/availabilityService.js';

jest.setTimeout(120000);

const TZ = 'Africa/Lagos';
let mongod;
let app;

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const weekly = () =>
  ALL_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] };
    return acc;
  }, {});

const dayKey = (offset = 3) => DateTime.now().setZone(TZ).plus({ days: offset }).toISODate();
const startAt = (offset = 3, time = '09:00') =>
  DateTime.fromISO(`${dayKey(offset)}T${time}`, { zone: TZ }).toUTC().toISO();

const createProvider = async (slug = 'lagos-barber') => {
  const user = await User.create({
    name: 'Lagos Barber',
    email: `${slug}@example.com`,
    password: 'password123',
    role: 'provider',
    businessName: 'Lagos Barber',
    slug,
  });
  const service = await Service.create({
    provider: user._id,
    name: 'Haircut',
    description: 'Standard cut',
    category: 'barber',
    price: 15000,
    duration: 1,
  });
  return { user, service };
};

const createSchedule = (providerId, overrides = {}) =>
  Schedule.create({
    provider: providerId,
    timezone: TZ,
    bufferTime: 0,
    weeklySchedule: weekly(),
    bookingWindowDays: 60,
    minimumLeadTimeMinutes: 0,
    unavailableDates: [],
    ...overrides,
  });

const bookingBody = (serviceId, start, extra = {}) => ({
  customer: { name: 'Ada Customer', phone: '+2348000000000' },
  serviceId: serviceId.toString(),
  providerSlug: 'lagos-barber',
  startAt: start,
  paymentType: 'bank_transfer',
  ...extra,
});

const postBooking = (body, idempotencyKey) => {
  const req = request(app).post('/api/bookings').send(body);
  if (idempotencyKey) req.set('Idempotency-Key', idempotencyKey);
  return req;
};

const availability = (serviceId, date) =>
  request(app)
    .get('/api/availability')
    .query({ slug: 'lagos-barber', service: serviceId.toString(), ...(date ? { date } : {}) });

/** App that fakes provider auth for private controllers. */
const providerApp = (providerId) => {
  const privateApp = express();
  privateApp.use(express.json());
  privateApp.use((req, _res, next) => {
    req.user = { _id: providerId, role: 'provider' };
    next();
  });
  privateApp.get('/api/schedule', getSchedule);
  privateApp.put('/api/schedule', updateSchedule);
  privateApp.put('/api/bookings/:id/status', updateBookingStatus);
  return privateApp;
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.HOLD_MINUTES = '30';
  process.env.CASH_HOLD_HOURS = '24';
  // Fail email fast instead of reaching Ethereal's network.
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = '1';
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.CRON_SECRET = 'test-cron-secret';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Booking.createIndexes(), SlotClaim.createIndexes(), Service.createIndexes()]);

  app = express();
  app.use(express.json());
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/bookings', bookingRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Booking.deleteMany({}),
    SlotClaim.deleteMany({}),
    Service.deleteMany({}),
    Schedule.deleteMany({}),
    Transaction.deleteMany({}),
    User.deleteMany({}),
  ]);
});

describe('GET /api/availability', () => {
  it('returns server-computed Lagos slots as UTC instants with a tz label', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const date = dayKey(3);

    const response = await availability(service._id, date);

    expect(response.status).toBe(200);
    expect(response.body.timezone).toBe(TZ);
    expect(response.body.timezoneLabel).toContain(TZ);
    expect(response.body.slots[0].localStart).toBe('09:00');
    // 09:00 Africa/Lagos (UTC+1) is 08:00Z: correct for a London customer.
    expect(response.body.slots[0].start).toBe(`${date}T08:00:00.000Z`);
    expect(response.body.days.length).toBe(61);
    expect(response.body.days.find((day) => day.date === date).available).toBe(true);
  });

  it('rejects a bad service id with 400 and an unknown one with 404', async () => {
    const { user } = await createProvider();
    await createSchedule(user._id);

    const invalid = await request(app)
      .get('/api/availability')
      .query({ slug: 'lagos-barber', service: 'not-an-id' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('INVALID_SERVICE_ID');

    const missing = await request(app)
      .get('/api/availability')
      .query({ slug: 'lagos-barber', service: new mongoose.Types.ObjectId().toString() });
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('SERVICE_NOT_FOUND');
  });
});

describe('booking claims', () => {
  it('lets exactly one of five parallel bookings win the same slot', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const start = startAt(3, '09:00');

    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        postBooking(
          bookingBody(service._id, start, {
            customer: { name: `Customer ${i}`, phone: '+2348000000000' },
          })
        )
      )
    );

    const created = responses.filter((response) => response.status === 201);
    const conflicts = responses.filter((response) => response.status === 409);

    expect(created).toHaveLength(1);
    expect(conflicts).toHaveLength(4);
    for (const conflict of conflicts) {
      expect(conflict.body.code).toBe('SLOT_UNAVAILABLE');
      expect(Array.isArray(conflict.body.alternatives)).toBe(true);
    }
    expect(await Booking.countDocuments({})).toBe(1);
    expect(await Transaction.countDocuments({})).toBe(1);
    expect(await SlotClaim.countDocuments({})).toBe(60);
  });

  it('rejects a shorter service that overlaps a longer booking', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const short = await Service.create({
      provider: user._id,
      name: 'Beard trim',
      description: 'Quick trim',
      price: 5000,
      duration: 0.5,
    });

    const first = await postBooking(bookingBody(service._id, startAt(3, '09:00')));
    expect(first.status).toBe(201);

    // 09:30–10:00 falls inside the 09:00–10:00 booking, with a different duration.
    const second = await postBooking(bookingBody(short._id, startAt(3, '09:30')));
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('SLOT_UNAVAILABLE');
  });

  it('keeps the calendar free after a cancelled booking releases its claims', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);

    const created = await postBooking(bookingBody(service._id, startAt(3, '09:00')));
    expect(created.status).toBe(201);
    const privateApp = providerApp(user._id);

    const cancelled = await request(privateApp)
      .put(`/api/bookings/${created.body.booking._id}/status`)
      .send({ status: 'cancelled' });
    expect(cancelled.status).toBe(200);
    expect(await SlotClaim.countDocuments({ booking: created.body.booking._id })).toBe(0);

    const date = dayKey(3);
    const after = await availability(service._id, date);
    expect(after.body.slots.some((slot) => slot.localStart === '09:00')).toBe(true);
  });
});

describe('hold policy', () => {
  it('sets a 30 minute bank-transfer hold and a 24 hour pay-in-person hold', async () => {
    const before = Date.now();
    const bank = computeHoldExpiresAt({ paymentMethod: 'bank_transfer', paymentStatus: 'awaiting_payment' });
    const cash = computeHoldExpiresAt({ paymentMethod: 'pay_later', paymentStatus: 'awaiting_payment' });
    const receipt = computeHoldExpiresAt({ paymentMethod: 'bank_transfer', paymentStatus: 'awaiting_verification' });

    expect(bank.getTime() - before).toBeGreaterThan(29 * 60 * 1000);
    expect(bank.getTime() - before).toBeLessThan(31 * 60 * 1000);
    expect(cash.getTime() - before).toBeGreaterThan(23.9 * 60 * 60 * 1000);
    expect(receipt).toBeNull();
  });

  it('persists the hold expiry and payment method on the booking', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);

    const bank = await postBooking(bookingBody(service._id, startAt(3, '09:00')));
    const cash = await postBooking(bookingBody(service._id, startAt(3, '11:00'), { paymentType: 'pay_later' }));

    expect(bank.status).toBe(201);
    expect(cash.status).toBe(201);
    expect(new Date(bank.body.booking.holdExpiresAt).getTime()).toBeLessThan(Date.now() + 31 * 60 * 1000);
    expect(cash.body.booking.paymentMethod).toBe('pay_later');
    expect(new Date(cash.body.booking.holdExpiresAt).getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    // The chosen method is persisted; the enum keeps legacy values valid.
    expect(bank.body.booking.paymentType).toBe('full');
    expect(bank.body.booking.paymentMethod).toBe('bank_transfer');
  });

  it('releases an elapsed hold lazily and lets the slot be rebooked', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const start = startAt(3, '09:00');

    const first = await postBooking(bookingBody(service._id, start));
    expect(first.status).toBe(201);
    await Booking.updateOne({ _id: first.body.booking._id }, { $set: { holdExpiresAt: new Date(Date.now() - 1000) } });

    const stillListed = await availability(service._id, dayKey(3));
    expect(stillListed.body.slots.some((slot) => slot.localStart === '09:00')).toBe(true);

    const second = await postBooking(bookingBody(service._id, start));
    expect(second.status).toBe(201);
    expect(second.body.booking._id).not.toBe(first.body.booking._id);

    const old = await Booking.findById(first.body.booking._id).lean();
    expect(old.status).toBe('cancelled');
  });

  it('sweeps expired holds via the cron endpoint', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const created = await postBooking(bookingBody(service._id, startAt(3, '09:00')));
    expect(created.status).toBe(201);
    await Booking.updateOne(
      { _id: created.body.booking._id },
      { $set: { holdExpiresAt: new Date(Date.now() - 1000) } }
    );

    const unauthorized = await request(app).post('/api/availability/sweep');
    expect(unauthorized.status).toBe(401);

    const swept = await request(app)
      .post('/api/availability/sweep')
      .set('x-cron-secret', 'test-cron-secret');
    expect(swept.status).toBe(200);
    expect(swept.body.released).toBe(1);
    expect((await Booking.findById(created.body.booking._id).lean()).status).toBe('cancelled');
    expect(await SlotClaim.countDocuments({})).toBe(0);
  });

  it('clears expired claims that have no live booking behind them', async () => {
    const { user } = await createProvider();
    const orphanBookingId = new mongoose.Types.ObjectId();
    const start = new Date(startAt(3, '09:00'));

    const claim = await claimSlot({
      providerId: user._id,
      bookingId: orphanBookingId,
      startAt: start,
      endAt: new Date(start.getTime() + 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(claim.ok).toBe(true);
    expect(await SlotClaim.countDocuments({ booking: orphanBookingId })).toBe(60);

    const result = await sweepExpiredHolds();
    expect(result.released).toBe(0);
    expect(await SlotClaim.countDocuments({ booking: orphanBookingId })).toBe(0);
  });

  it('syncs claims when a booking is confirmed outside the availability controller', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const created = await postBooking(bookingBody(service._id, startAt(3, '09:00')));

    // Mirrors payment verification: it saves the booking, never calls the service.
    const booking = await Booking.findById(created.body.booking._id);
    booking.status = 'confirmed';
    await booking.save();

    const claims = await SlotClaim.find({ booking: booking._id }).lean();
    expect(claims.length).toBe(60);
    expect(claims.every((claim) => claim.status === 'confirmed' && claim.expiresAt === null)).toBe(true);
  });

  it('never expires a booking with a receipt attached, and never a confirmed one', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);

    const receipt = await postBooking(
      bookingBody(service._id, startAt(3, '09:00'), { receiptImage: 'data:image/png;base64,AAAA' })
    );
    expect(receipt.status).toBe(201);
    expect(receipt.body.booking.paymentStatus).toBe('awaiting_verification');
    expect(receipt.body.booking.holdExpiresAt).toBeNull();

    const year = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await releaseExpiredHolds(user._id, { now: year });
    expect((await Booking.findById(receipt.body.booking._id).lean()).status).toBe('pending');
    expect(await SlotClaim.countDocuments({ booking: receipt.body.booking._id })).toBe(60);

    const confirmed = await postBooking(bookingBody(service._id, startAt(3, '11:00')));
    expect(confirmed.status).toBe(201);
    // Confirmation now happens through payment verification; this test only
    // needs the confirmed state so it saves directly (the model hook syncs claims).
    const confirmedBooking = await Booking.findById(confirmed.body.booking._id);
    confirmedBooking.status = 'confirmed';
    confirmedBooking.paymentStatus = 'confirmed';
    await confirmedBooking.save();

    const remaining = await releaseExpiredHolds(user._id, { now: year });
    expect(remaining).toBe(0);
    expect((await Booking.findById(confirmed.body.booking._id).lean()).status).toBe('confirmed');
    const claims = await SlotClaim.find({ booking: confirmed.body.booking._id }).lean();
    expect(claims.length).toBe(60);
    expect(claims.every((claim) => claim.status === 'confirmed' && claim.expiresAt === null)).toBe(true);
  });
});

describe('server-enforced booking rules', () => {
  it('refuses past, blocked, out-of-hours, lead-time and horizon requests', async () => {
    const { user, service } = await createProvider();
    const schedule = await createSchedule(user._id);

    const past = DateTime.now().setZone(TZ).minus({ hours: 1 });
    const pastResponse = await postBooking(bookingBody(service._id, past.toUTC().toISO()));
    expect(pastResponse.status).toBe(400);
    expect(pastResponse.body.code).toBe('SLOT_NOT_AVAILABLE');

    const outOfHours = await postBooking(bookingBody(service._id, startAt(3, '19:00')));
    expect(outOfHours.status).toBe(400);

    await Schedule.updateOne(
      { _id: schedule._id },
      { $set: { unavailableDates: [{ date: new Date(`${dayKey(4)}T00:00:00Z`), endDate: null, reason: 'Holiday' }] } }
    );
    const blocked = await postBooking(bookingBody(service._id, startAt(4, '09:00')));
    expect(blocked.status).toBe(400);
    expect(blocked.body.reason).toBe('blocked');
    const blockedDay = await availability(service._id, dayKey(4));
    expect(blockedDay.body.slots).toHaveLength(0);

    await Schedule.updateOne({ _id: schedule._id }, { $set: { minimumLeadTimeMinutes: 4 * 24 * 60 } });
    const lead = await postBooking(bookingBody(service._id, startAt(3, '11:00')));
    expect(lead.status).toBe(400);
    expect(lead.body.reason).toBe('lead_time');

    await Schedule.updateOne(
      { _id: schedule._id },
      { $set: { minimumLeadTimeMinutes: 0, bookingWindowDays: 2 } }
    );
    const beyond = await postBooking(bookingBody(service._id, startAt(5, '09:00')));
    expect(beyond.status).toBe(400);
    expect(beyond.body.reason).toBe('beyond_horizon');
  });

  it('rejects invalid service ids instead of falling back to another service', async () => {
    const { user } = await createProvider();
    await createSchedule(user._id);
    const start = startAt(3, '09:00');

    const invalid = await postBooking({ ...bookingBody(new mongoose.Types.ObjectId(), start), serviceId: 'nope' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('INVALID_SERVICE_ID');

    const missing = await postBooking(bookingBody(new mongoose.Types.ObjectId(), start));
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('SERVICE_NOT_FOUND');

    const other = await createProvider('other-provider');
    const foreign = await request(app)
      .post('/api/bookings')
      .send({ ...bookingBody(other.service._id, start), providerSlug: 'lagos-barber' });
    expect(foreign.status).toBe(404);
  });

  it('refuses a service whose stored duration is zero', async () => {
    const { user } = await createProvider();
    await createSchedule(user._id);
    const inserted = await Service.collection.insertOne({
      provider: user._id,
      name: 'Broken service',
      description: 'x',
      price: 1,
      duration: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await postBooking(bookingBody(inserted.insertedId, startAt(3, '09:00')));
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('SERVICE_DURATION_INVALID');
  });
});

describe('idempotency', () => {
  it('returns the original booking for a repeated Idempotency-Key', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const body = bookingBody(service._id, startAt(3, '09:00'));

    const first = await postBooking(body, 'submit-123');
    const second = await postBooking(body, 'submit-123');

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);
    expect(second.body.booking._id).toBe(first.body.booking._id);
    expect(await Booking.countDocuments({})).toBe(1);
    expect(await SlotClaim.countDocuments({})).toBe(60);
  });

  it('does not let a different key take the same slot twice', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const body = bookingBody(service._id, startAt(3, '09:00'));

    expect((await postBooking(body, 'key-a')).status).toBe(201);
    const conflict = await postBooking(body, 'key-b');
    expect(conflict.status).toBe(409);
    expect(await Booking.countDocuments({})).toBe(1);
  });
});

describe('settings persistence', () => {
  it('saves horizon, lead time, timezone, buffer and blocked ranges, and enforces them', async () => {
    const { user, service } = await createProvider();
    await createSchedule(user._id);
    const privateApp = providerApp(user._id);

    const response = await request(privateApp)
      .put('/api/schedule')
      .send({
        weeklySchedule: weekly(),
        bufferTime: 30,
        timezone: 'Africa/Lagos',
        bookingWindowDays: 10,
        minimumLeadTimeMinutes: 120,
        unavailableDates: [
          {
            date: new Date(`${dayKey(5)}T00:00:00Z`).toISOString(),
            endDate: new Date(`${dayKey(7)}T00:00:00Z`).toISOString(),
            reason: 'Travel',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.bookingWindowDays).toBe(10);
    expect(response.body.minimumLeadTimeMinutes).toBe(120);
    expect(response.body.bufferTime).toBe(30);
    expect(response.body.unavailableDates[0].endDate).toBeTruthy();

    const stored = await Schedule.findOne({ provider: user._id }).lean();
    expect(stored.bookingWindowDays).toBe(10);
    expect(stored.minimumLeadTimeMinutes).toBe(120);

    const available = await availability(service._id);
    expect(available.body.horizonDays).toBe(10);
    expect(available.body.days).toHaveLength(11);
    expect(available.body.days.find((day) => day.date === dayKey(6)).available).toBe(false);

    const reloaded = await request(privateApp).get('/api/schedule');
    expect(reloaded.body.bookingWindowDays).toBe(10);
    expect(reloaded.body.minimumLeadTimeMinutes).toBe(120);

    const invalid = await request(privateApp)
      .put('/api/schedule')
      .send({ timezone: 'Mars/Olympus' });
    expect(invalid.status).toBe(400);
  });
});
