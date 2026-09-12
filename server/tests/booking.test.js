import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import express from 'express';
import request from 'supertest';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { createBooking } from '../controllers/bookingController.js';
import { setMockMode } from '../utils/mockMode.js';

const bookingData = () => ({
  customer: { name: 'Test Customer', phone: '+2348000000000' },
  provider: new mongoose.Types.ObjectId(),
  service: new mongoose.Types.ObjectId(),
  date: new Date('2026-09-17T12:30:00Z'),
  timeSlot: { startTime: '12:30', endTime: '13:30' },
  paymentType: 'bank_transfer',
  pricing: { servicePrice: 1, depositAmount: 1, totalAmount: 1, currency: 'NGN' },
});

describe('POST /api/bookings', () => {
  it('returns 201 and persists a bank-transfer booking and transaction', async () => {
    setMockMode(false);
    const data = bookingData();
    jest.spyOn(Service, 'findById').mockResolvedValue({
      _id: data.service, provider: data.provider, name: 'Physical Store Visit', price: 1,
    });
    // Stub only database I/O: the real Mongoose validation and save hooks run.
    const insertBooking = jest.spyOn(Booking.collection, 'insertOne').mockResolvedValue({ acknowledged: true });
    const insertTransaction = jest.spyOn(Transaction.collection, 'insertOne').mockResolvedValue({ acknowledged: true });
    jest.spyOn(User, 'findById').mockResolvedValue(null);
    const app = express();
    app.use(express.json());
    app.post('/api/bookings', createBooking);

    const response = await request(app).post('/api/bookings').send({
      customer: data.customer,
      serviceId: data.service.toString(),
      date: data.date.toISOString(),
      timeSlot: data.timeSlot,
      paymentType: 'bank_transfer',
    });

    expect(response.status).toBe(201);
    expect(response.body.booking.bookingNumber).toMatch(/^NB-/);
    expect(response.body.booking.paymentStatus).toBe('awaiting_payment');
    expect(insertBooking).toHaveBeenCalledTimes(1);
    expect(insertTransaction).toHaveBeenCalledTimes(1);
    expect(insertTransaction.mock.calls[0][0].booking.toString()).toBe(response.body.booking._id);
  });
});

afterEach(() => jest.restoreAllMocks());

describe('Booking number generation', () => {
  it('saves a booking without a caller-supplied number or customer email', async () => {
    const insert = jest.spyOn(Booking.collection, 'insertOne').mockResolvedValue({ acknowledged: true });
    const booking = await Booking.create(bookingData());
    expect(booking.bookingNumber).toMatch(/^NB-/);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0].bookingNumber).toBe(booking.bookingNumber);
  });

  it('keeps an existing reference when validating again', async () => {
    const booking = new Booking({ ...bookingData(), bookingNumber: 'NB-EXISTING' });
    await booking.validate();
    await booking.validate();
    expect(booking.bookingNumber).toBe('NB-EXISTING');
  });

  it('generates distinct references for simultaneous bookings without counting documents', async () => {
    const count = jest.spyOn(Booking, 'countDocuments');
    const bookings = Array.from({ length: 100 }, () => new Booking(bookingData()));
    await Promise.all(bookings.map(booking => booking.validate()));
    expect(new Set(bookings.map(booking => booking.bookingNumber)).size).toBe(100);
    expect(count).not.toHaveBeenCalled();
  });
});
