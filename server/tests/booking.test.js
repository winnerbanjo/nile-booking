import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';

const bookingData = () => ({
  customer: { name: 'Test Customer', phone: '+2348000000000' },
  provider: new mongoose.Types.ObjectId(),
  service: new mongoose.Types.ObjectId(),
  date: new Date('2026-09-17T12:30:00Z'),
  timeSlot: { startTime: '12:30', endTime: '13:30' },
  paymentType: 'bank_transfer',
  pricing: { servicePrice: 1, depositAmount: 1, totalAmount: 1, currency: 'NGN' },
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
