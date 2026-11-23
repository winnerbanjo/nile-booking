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
import Transaction from '../models/Transaction.js';
import SlotClaim from '../models/SlotClaim.js';
import bookingRoutes from '../routes/bookingRoutes.js';
import {
  BOOKING_EVENTS,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  TRANSITIONS,
  BookingTransitionError,
  canTransition,
  transition,
} from '../services/bookingStateMachine.js';
import {
  computeBookingAmounts,
  applyGatewayFailure,
  applyGatewaySuccess,
  rejectBooking,
  verifyBookingPayment,
} from '../services/paymentLifecycleService.js';
import { claimSlot, releaseExpiredHolds } from '../services/availabilityService.js';
import { cancelBooking } from '../services/paymentLifecycleService.js';
import { updateBookingStatus } from '../controllers/bookingController.js';
import { getPendingVerifications, verifyReceipt } from '../controllers/adminController.js';

jest.setTimeout(120000);

const TZ = 'Africa/Lagos';
let mongod;
let app;

const weekly = () =>
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].reduce((acc, day) => {
    acc[day] = { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] };
    return acc;
  }, {});

const futureStart = () => DateTime.now().setZone(TZ).plus({ days: 3 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });

const fakeEmail = () => {
  const calls = [];
  const fn = async (bookingId) => {
    calls.push(bookingId);
    return { success: true };
  };
  fn.calls = calls;
  return fn;
};

const makeProvider = async (slug = 'lifecycle-provider') => {
  const provider = await User.create({
    name: 'Lifecycle Barber',
    email: `${slug}@example.com`,
    password: 'password123',
    role: 'provider',
    businessName: 'Lifecycle Barber',
    slug,
  });
  const service = await Service.create({
    provider: provider._id,
    name: 'Haircut',
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

const makeBooking = async ({ provider, service, paymentType = 'full', paymentMethod = 'bank_transfer', receipt = true, hoursFrom = 72 }) => {
  const start = futureStart().plus({ hours: hoursFrom });
  const { totalPrice, depositAmount, expectedPayment } = computeBookingAmounts({
    servicePrice: service.price,
    paymentType,
  });
  const booking = await Booking.create({
    customer: { name: 'Test Customer', email: 'customer@example.com', phone: '+2348000000000' },
    provider: provider._id,
    service: service._id,
    date: start.toUTC().toJSDate(),
    startAt: start.toUTC().toJSDate(),
    endAt: start.plus({ hours: 1 }).toUTC().toJSDate(),
    timeSlot: { startTime: '09:00', endTime: '10:00' },
    status: 'pending',
    paymentStatus: receipt ? 'awaiting_verification' : 'awaiting_payment',
    paymentType: 'bank_transfer',
    paymentMethod,
    receiptImageUrl: receipt ? 'https://example.com/receipt.png' : null,
    pricing: { servicePrice: totalPrice, depositAmount, totalAmount: totalPrice, currency: 'NGN' },
    totalPrice,
    depositAmount,
    balanceDue: totalPrice,
  });

  const ref = `TX-${new mongoose.Types.ObjectId()}`;
  const transaction = await Transaction.create({
    booking: booking._id,
    provider: provider._id,
    type: paymentType === 'deposit' ? 'deposit' : 'payment',
    amount: expectedPayment,
    currency: 'NGN',
    paymentGateway: paymentMethod,
    gatewayReference: ref,
    transactionReference: ref,
    customerEmail: 'customer@example.com',
    status: 'pending',
  });

  await claimSlot({
    providerId: provider._id,
    bookingId: booking._id,
    startAt: booking.startAt,
    endAt: booking.endAt,
    expiresAt: null,
  });

  return { booking, transaction, ref };
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.MAILTRAP_TOKEN; // Mailtrap helper logs mock emails instead of calling out
  // Keep booking-creation notification tests offline even when suites run in-band.
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = '1';
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.HOLD_MINUTES = '30';
  process.env.CASH_HOLD_HOURS = '24';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    Booking.createIndexes(),
    Transaction.createIndexes(),
    SlotClaim.createIndexes(),
    Service.createIndexes(),
  ]);

  app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Booking.deleteMany({}),
    Transaction.deleteMany({}),
    SlotClaim.deleteMany({}),
    Service.deleteMany({}),
    Schedule.deleteMany({}),
    User.deleteMany({}),
  ]);
});

describe('booking state machine', () => {
  it('shares its vocabulary with the Booking model enums', () => {
    expect([...Booking.schema.path('status').enumValues].sort()).toEqual([...BOOKING_STATUSES].sort());
    expect([...Booking.schema.path('paymentStatus').enumValues].sort()).toEqual([...PAYMENT_STATUSES].sort());
  });

  it('accepts exactly the transitions in the table and rejects every other pair', () => {
    let allowedCount = 0;
    let rejectedCount = 0;

    for (const event of Object.values(BOOKING_EVENTS)) {
      expect(TRANSITIONS[event]).toBeDefined();
      for (const status of BOOKING_STATUSES) {
        for (const paymentStatus of PAYMENT_STATUSES) {
          const booking = { status, paymentStatus };
          const expected = TRANSITIONS[event].from.some(
            (entry) => entry.status === status && entry.paymentStatus.includes(paymentStatus)
          );
          expect(canTransition(booking, event)).toBe(expected);

          if (expected) {
            transition(booking, event, { role: 'admin' });
            expect(booking.status).toBe(TRANSITIONS[event].to.status);
            expect(booking.paymentStatus).toBe(TRANSITIONS[event].to.paymentStatus);
            allowedCount += 1;
          } else {
            expect(() => transition({ status, paymentStatus }, event)).toThrow(BookingTransitionError);
            rejectedCount += 1;
          }
        }
      }
    }

    expect(allowedCount).toBeGreaterThan(0);
    expect(rejectedCount).toBeGreaterThan(allowedCount);
  });

  it('rejects unknown events', () => {
    expect(() => transition({ status: 'pending', paymentStatus: 'awaiting_payment' }, 'teleport')).toThrow(
      /Unknown booking event/
    );
  });

  it('derives deposit amounts from DEPOSIT_PERCENT (default 50)', () => {
    const amounts = computeBookingAmounts({ servicePrice: 10000, paymentType: 'deposit' });
    expect(amounts.totalPrice).toBe(10000);
    expect(amounts.depositAmount).toBe(5000);
    expect(amounts.expectedPayment).toBe(5000);
    expect(amounts.balanceDue).toBe(10000);
  });
});

describe('booking creation money truth', () => {
  it('persists payment method and a deposit transaction for the amount due now', async () => {
    const { provider, service } = await makeProvider();
    const start = futureStart().toUTC().toISO();

    const response = await request(app).post('/api/bookings').send({
      customer: { name: 'Deposit Customer', phone: '+2348000000000' },
      serviceId: service._id.toString(),
      providerSlug: provider.slug,
      startAt: start,
      paymentType: 'deposit',
    });

    expect(response.status).toBe(201);
    const booking = response.body.booking;
    expect(booking.paymentMethod).toBe('bank_transfer');
    expect(booking.totalPrice).toBe(10000);
    expect(booking.depositAmount).toBe(5000);
    expect(booking.balanceDue).toBe(10000);

    const transaction = await Transaction.findOne({ booking: booking._id }).lean();
    expect(transaction.amount).toBe(5000);
    expect(transaction.type).toBe('deposit');
  });

  it('persists pay-in-person as pay_later and keeps the cash hold', async () => {
    const { provider, service } = await makeProvider();
    const start = futureStart().toUTC().toISO();

    const response = await request(app).post('/api/bookings').send({
      customer: { name: 'Cash Customer', phone: '+2348000000000' },
      serviceId: service._id.toString(),
      providerSlug: provider.slug,
      startAt: start,
      paymentType: 'pay_later',
    });

    expect(response.status).toBe(201);
    expect(response.body.booking.paymentMethod).toBe('pay_later');
    expect(response.body.booking.paymentStatus).toBe('awaiting_payment');
    const transaction = await Transaction.findOne({ booking: response.body.booking._id }).lean();
    expect(transaction.paymentGateway).toBe('pay_later');
    expect(transaction.amount).toBe(10000);
  });

  it('creates no booking or claim when the transaction insert fails', async () => {
    const { provider, service } = await makeProvider();
    const start = futureStart().toUTC().toISO();
    const create = jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('transaction write failed'));

    const response = await request(app).post('/api/bookings').send({
      customer: { name: 'Failure Customer', phone: '+2348000000000' },
      serviceId: service._id.toString(),
      providerSlug: provider.slug,
      startAt: start,
      paymentType: 'full',
    });

    expect(response.status).toBe(500);
    expect(await Booking.countDocuments({})).toBe(0);
    expect(await SlotClaim.countDocuments({})).toBe(0);
    create.mockRestore();
  });
});

describe('manual verification', () => {
  it('requires a receipt for bank transfer', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service, receipt: false });

    await expect(
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: booking.totalPrice,
        sendEmailFn: fakeEmail(),
      })
    ).rejects.toMatchObject({ statusCode: 422, code: 'RECEIPT_REQUIRED' });

    const stored = await Booking.findById(booking._id).lean();
    expect(stored.status).toBe('pending');
  });

  it('requires an explicit cash acknowledgment for pay-in-person', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service, paymentMethod: 'pay_later', receipt: false });

    await expect(
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: 10000,
        sendEmailFn: fakeEmail(),
      })
    ).rejects.toMatchObject({ statusCode: 422, code: 'CASH_ACKNOWLEDGEMENT_REQUIRED' });
  });

  it('rejects an amount mismatch without an override and accepts it with one', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });

    await expect(
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: 7000,
        sendEmailFn: fakeEmail(),
      })
    ).rejects.toMatchObject({ statusCode: 422, code: 'AMOUNT_MISMATCH' });

    const email = fakeEmail();
    const result = await verifyBookingPayment({
      bookingId: booking._id,
      actor: provider,
      amountReceived: 7000,
      overrideReason: 'Customer paid the rest in cash',
      sendEmailFn: email,
    });

    expect(result.booking.status).toBe('confirmed');
    expect(result.booking.paymentStatus).toBe('confirmed');
    expect(result.booking.balanceDue).toBe(3000);
    expect(result.partial).toBe(true);
    expect(result.transaction.status).toBe('successful');
    expect(result.transaction.amountReceived).toBe(7000);
    expect(result.booking.verifiedBy.toString()).toBe(provider._id.toString());
    expect(result.booking.verifiedAt).toBeTruthy();
    expect(result.booking.verificationOverrideReason).toBe('Customer paid the rest in cash');
    expect((await Booking.findById(booking._id).lean()).verificationOverrideReason).toBe('Customer paid the rest in cash');
    expect(result.booking.confirmationEmail.status).toBe('sent');
    expect(email.calls).toHaveLength(1);
  });

  it('confirms cash with acknowledgment and records the received amount', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service, paymentMethod: 'pay_later', receipt: false });

    const result = await verifyBookingPayment({
      bookingId: booking._id,
      actor: provider,
      amountReceived: 10000,
      cashAcknowledged: true,
      sendEmailFn: fakeEmail(),
    });

    expect(result.booking.status).toBe('confirmed');
    expect(result.booking.paymentStatus).toBe('confirmed');
    expect(result.booking.balanceDue).toBe(0);
    expect(result.booking.cashAcknowledged).toBe(true);
    expect(result.booking.cashAcknowledgedAt).toBeTruthy();
    const claims = await SlotClaim.find({ booking: booking._id }).lean();
    expect(claims.every((claim) => claim.status === 'confirmed')).toBe(true);
  });

  it('is idempotent: double verify sends one email and keeps one coherent state', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });
    const email = fakeEmail();

    const results = await Promise.all([
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: 10000,
        sendEmailFn: email,
      }),
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: 10000,
        sendEmailFn: email,
      }),
    ]);

    expect(results.some((result) => result.alreadyVerified)).toBe(true);
    expect(email.calls).toHaveLength(1);
    expect(await Booking.countDocuments({})).toBe(1);
    const stored = await Booking.findById(booking._id).lean();
    expect(stored.status).toBe('confirmed');
    expect(stored.paymentStatus).toBe('confirmed');
    expect(stored.confirmationEmail.status).toBe('sent');
  });

  it('refuses verification after an expired hold has released the slot', async () => {
    const { provider, service } = await makeProvider();
    const { booking, transaction } = await makeBooking({
      provider,
      service,
      paymentType: 'pay_later',
      paymentMethod: 'pay_later',
      receipt: false,
    });

    await Booking.updateOne(
      { _id: booking._id },
      { $set: { holdExpiresAt: new Date(Date.now() - 1000) } }
    );
    expect(await releaseExpiredHolds(provider._id)).toBe(1);

    const released = await Booking.findById(booking._id).lean();
    expect(released.status).toBe('cancelled');
    expect(released.paymentStatus).toBe('cancelled');

    await expect(
      verifyBookingPayment({
        bookingId: booking._id,
        actor: provider,
        amountReceived: 10000,
        cashAcknowledged: true,
        sendEmailFn: fakeEmail(),
      })
    ).rejects.toMatchObject({ statusCode: 409, code: 'INVALID_BOOKING_TRANSITION' });

    const after = await Booking.findById(booking._id).lean();
    expect(after.status).toBe('cancelled');
    expect(after.amountReceived).toBe(0);
    expect((await Transaction.findById(transaction._id).lean()).status).toBe('pending');
  });

  it('records an email failure without failing verification', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });

    const result = await verifyBookingPayment({
      bookingId: booking._id,
      actor: provider,
      amountReceived: 10000,
      sendEmailFn: async () => ({ success: false, error: 'SMTP down' }),
    });

    expect(result.booking.status).toBe('confirmed');
    expect(result.email.status).toBe('failed');
    const stored = await Booking.findById(booking._id).lean();
    expect(stored.confirmationEmail.status).toBe('failed');
    expect(stored.confirmationEmail.error).toContain('SMTP down');
  });
});

describe('reject and cancel', () => {
  it('rejecting releases the slot and marks payment cancelled', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });

    const result = await rejectBooking({ bookingId: booking._id, actor: provider, reason: 'Bad receipt' });

    expect(result.booking.status).toBe('rejected');
    expect(result.booking.paymentStatus).toBe('cancelled');
    expect(await SlotClaim.countDocuments({ booking: booking._id })).toBe(0);
    const transaction = await Transaction.findOne({ booking: booking._id }).lean();
    expect(transaction.status).toBe('failed');
  });

  it('cancelling a confirmed booking releases the slot', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });
    await verifyBookingPayment({
      bookingId: booking._id,
      actor: provider,
      amountReceived: 10000,
      sendEmailFn: fakeEmail(),
    });

    const result = await cancelBooking({ bookingId: booking._id, actor: provider, reason: 'Provider unavailable' });

    expect(result.booking.status).toBe('cancelled');
    expect(result.booking.paymentStatus).toBe('cancelled');
    expect(await SlotClaim.countDocuments({ booking: booking._id })).toBe(0);
  });
});

describe('provider status endpoint and admin queue', () => {
  const authApp = (user) => {
    const auth = express();
    auth.use(express.json());
    auth.use((req, _res, next) => {
      req.user = user;
      next();
    });
    auth.put('/api/bookings/:id/status', updateBookingStatus);
    auth.get('/api/admin/verifications', getPendingVerifications);
    auth.post('/api/admin/verifications/:bookingId/verify', verifyReceipt);
    return auth;
  };

  it('refuses to confirm a booking through the status endpoint, even with a receipt', async () => {
    const { provider, service } = await makeProvider();
    const { booking } = await makeBooking({ provider, service });
    const providerApp = authApp({ _id: provider._id, role: 'provider' });

    const response = await request(providerApp)
      .put(`/api/bookings/${booking._id}/status`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PAYMENT_VERIFICATION_REQUIRED');
    expect((await Booking.findById(booking._id).lean()).status).toBe('pending');
  });

  it('uses the real verification fields in the admin queue and confirms through the same transition', async () => {
    const { provider, service } = await makeProvider();
    const { booking, transaction } = await makeBooking({ provider, service, receipt: true });
    const adminApp = authApp({ _id: new mongoose.Types.ObjectId(), role: 'admin' });

    const queue = await request(adminApp).get('/api/admin/verifications');
    expect(queue.status).toBe(200);
    expect(queue.body.bookings.map((entry) => entry.bookingNumber)).toContain(booking.bookingNumber);

    const approve = await request(adminApp)
      .post(`/api/admin/verifications/${booking._id}/verify`)
      .send({ action: 'approve' });

    expect(approve.status).toBe(200);
    expect(approve.body.booking.status).toBe('confirmed');
    expect(approve.body.booking.paymentStatus).toBe('confirmed');
    const storedTransaction = await Transaction.findById(transaction._id).lean();
    expect(storedTransaction.status).toBe('successful');
    expect(storedTransaction.amountReceived).toBe(10000);
  });
});

describe('gateway handlers', () => {
  it('confirms once on success and ignores duplicate callbacks', async () => {
    const { provider, service } = await makeProvider();
    const { booking, transaction, ref } = await makeBooking({ provider, service, receipt: false });
    const email = fakeEmail();

    const first = await applyGatewaySuccess({
      reference: ref,
      gateway: 'paystack',
      amount: 10000,
      currency: 'NGN',
      metadata: {},
      sendEmailFn: email,
    });
    const duplicate = await applyGatewaySuccess({
      reference: ref,
      gateway: 'paystack',
      amount: 10000,
      currency: 'NGN',
      metadata: {},
      sendEmailFn: email,
    });

    expect(first.success).toBe(true);
    expect(first.booking.status).toBe('confirmed');
    expect(duplicate.alreadyProcessed).toBe(true);
    expect(email.calls).toHaveLength(1);
    const stored = await Booking.findById(booking._id).lean();
    expect(stored.paymentStatus).toBe('confirmed');
    const storedTx = await Transaction.findById(transaction._id).lean();
    expect(storedTx.status).toBe('successful');
  });

  it('writes a failed transaction on failure and never downgrades a success', async () => {
    const { provider, service } = await makeProvider();
    const failed = await makeBooking({ provider, service, receipt: false, hoursFrom: 72 });
    await applyGatewayFailure({ reference: failed.ref, reason: 'insufficient funds' });

    expect((await Transaction.findById(failed.transaction._id).lean()).status).toBe('failed');
    expect((await Booking.findById(failed.booking._id).lean()).status).toBe('pending');
    expect((await Booking.findById(failed.booking._id).lean()).paymentStatus).toBe('awaiting_payment');

    const succeeded = await makeBooking({ provider, service, receipt: false, hoursFrom: 96 });
    await applyGatewaySuccess({
      reference: succeeded.ref,
      gateway: 'paystack',
      amount: 10000,
      currency: 'NGN',
      sendEmailFn: fakeEmail(),
    });
    await applyGatewayFailure({ reference: succeeded.ref, reason: 'late failure callback' });

    expect((await Transaction.findById(succeeded.transaction._id).lean()).status).toBe('successful');
    expect((await Booking.findById(succeeded.booking._id).lean()).status).toBe('confirmed');
  });

  it('marks a gateway amount mismatch as failed without confirming', async () => {
    const { provider, service } = await makeProvider();
    const { booking, transaction, ref } = await makeBooking({ provider, service, receipt: false });

    const result = await applyGatewaySuccess({
      reference: ref,
      gateway: 'flutterwave',
      amount: 1,
      currency: 'NGN',
      sendEmailFn: fakeEmail(),
    });

    expect(result.mismatch).toBe(true);
    expect((await Booking.findById(booking._id).lean()).status).toBe('pending');
    expect((await Transaction.findById(transaction._id).lean()).status).toBe('failed');
  });
});
