import Booking from '../models/Booking.js';
import SlotClaim from '../models/SlotClaim.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { getMockMode, mockServices } from '../utils/mockMode.js';
import { sendEmail } from '../utils/email.js';
import { paystackService, flutterwaveService } from '../services/paymentService.js';
import {
  AvailabilityError,
  claimSlot,
  computeHoldExpiresAt,
  deriveStartAt,
  getAvailability,
  releaseExpiredHolds,
  releaseSlot,
  resolveAvailabilityContext,
  validateRequestedStart,
} from '../services/availabilityService.js';
import { DateTime } from 'luxon';
import crypto from 'crypto';

const getIdempotencyKey = (req) => {
  const raw = req.headers['idempotency-key'];
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  if (!key || key.length > 200) return undefined;
  return key;
};

const findIdempotentBooking = async (providerId, idempotencyKey, { requireClaims = false } = {}) => {
  if (!idempotencyKey) return null;
  const existing = await Booking.findOne({ provider: providerId, idempotencyKey }).lean();
  if (!existing) return null;
  if (!requireClaims) return existing;
  // During a create race, only return a booking that actually owns its slot;
  // otherwise the other request is about to roll it back and return a 409.
  const claims = await SlotClaim.countDocuments({ booking: existing._id });
  return claims > 0 ? existing : null;
};

const availabilityPayload = async (context, serviceId, startAt) => {
  try {
    const zone = context.schedule.timezone;
    const date = startAt ? DateTime.fromJSDate(new Date(startAt), { zone }).toISODate() : undefined;
    return await getAvailability({ provider: context.provider._id.toString(), serviceId, date });
  } catch (error) {
    return null;
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  try {
    const {
      customer,
      serviceId,
      providerSlug,
      date,
      startAt,
      timeSlot,
      paymentType,
      notes,
      receiptImage,
    } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ message: 'Customer information is required' });
    }

    if (getMockMode()) {
      const mockService = mockServices.find(s => s._id === serviceId) || mockServices[0];
      const servicePrice = mockService ? mockService.price : 15000;
      const depositAmount = paymentType === 'deposit' ? servicePrice * 0.5 : servicePrice;

      const mockBooking = {
        _id: `booking_${Date.now()}`,
        bookingNumber: `BK-${Date.now().toString().slice(-6)}`,
        customer: {
          name: customer.name,
          email: customer.email || 'client@example.com',
          phone: customer.phone,
        },
        provider: mockService ? mockService.provider : 'mock_user_barber_id_123',
        service: mockService || {
          _id: 'service_1_id_123',
          name: 'Skin Fade & Beard Trim',
          price: 15000,
          duration: 1,
        },
        date: new Date(date).toISOString(),
        timeSlot: timeSlot || { startTime: '10:00', endTime: '11:00' },
        status: 'pending',
        paymentStatus: 'awaiting_payment',
        paymentType: paymentType || 'bank_transfer',
        receiptImage: receiptImage || null,
        pricing: {
          servicePrice,
          depositAmount,
          totalAmount: servicePrice,
          currency: 'NGN',
        },
        createdAt: new Date().toISOString(),
      };

      return res.status(201).json({
        booking: mockBooking,
        paymentData: null,
      });
    }

    // Database Mode — the server is the availability authority from here on.
    if (!serviceId) {
      return res.status(400).json({ message: 'A valid service is required.', code: 'SERVICE_REQUIRED' });
    }

    const idempotencyKey = getIdempotencyKey(req);
    let context;
    try {
      context = await resolveAvailabilityContext({
        provider: typeof req.body.provider === 'string' ? req.body.provider : undefined,
        slug: providerSlug,
        serviceId,
      });
    } catch (error) {
      if (error instanceof AvailabilityError) {
        return res.status(error.status).json({ message: error.message, code: error.code });
      }
      throw error;
    }

    const service = context.service;
    const providerId = context.provider._id;

    if (idempotencyKey) {
      const existing = await findIdempotentBooking(providerId, idempotencyKey);
      if (existing) {
        return res.status(200).json({ booking: existing, idempotent: true });
      }
    }

    // Lazy sweep so an elapsed pending hold can be re-booked immediately.
    await releaseExpiredHolds(providerId);

    const requestedStart =
      (startAt ? new Date(startAt) : null) ||
      deriveStartAt({ date, startTime: timeSlot?.startTime, timezone: context.schedule.timezone });

    if (!requestedStart || Number.isNaN(new Date(requestedStart).getTime())) {
      return res.status(400).json({
        message: 'A valid booking time is required. Refresh availability and pick a slot again.',
        code: 'INVALID_START',
      });
    }

    let slot;
    try {
      slot = await validateRequestedStart({
        schedule: context.schedule,
        providerId,
        service,
        startAt: requestedStart,
      });
    } catch (error) {
      if (error instanceof AvailabilityError) {
        const payload = { message: error.message, code: error.code, ...error.details };
        if (error.status === 409) {
          const availability = await availabilityPayload(context, serviceId, requestedStart);
          return res.status(409).json({
            ...payload,
            date: availability?.date,
            timezone: availability?.timezone,
            alternatives: availability?.alternatives || [],
          });
        }
        return res.status(error.status).json(payload);
      }
      throw error;
    }

    const paymentMethod = paymentType === 'pay_later' ? 'pay_later' : 'bank_transfer';
    const bookingPaymentType = ['full', 'deposit', 'pay_later'].includes(paymentType) ? paymentType : 'full';
    const hasReceipt = paymentMethod === 'bank_transfer' && !!receiptImage;
    const paymentStatus = hasReceipt ? 'awaiting_verification' : 'awaiting_payment';
    const holdExpiresAt = computeHoldExpiresAt({ paymentMethod, paymentStatus });
    const servicePrice = service.price;
    const totalPrice = servicePrice;
    const depositAmount = paymentType === 'deposit' ? servicePrice * 0.5 : 0;
    const expectedPayment = depositAmount || servicePrice;

    // NOTE: We do NOT await Cloudinary here — it would exceed Vercel's function timeout.
    // The booking is created immediately; the receipt uploads in the background.
    let booking;
    try {
      booking = await Booking.create({
        customer,
        provider: providerId,
        service: service._id,
        date: slot.startAt,
        startAt: slot.startAt,
        endAt: slot.endAt,
        timeSlot: { startTime: slot.localStart, endTime: slot.localEnd },
        status: 'pending',
        paymentStatus,
        paymentType: bookingPaymentType,
        paymentMethod,
        holdExpiresAt,
        idempotencyKey,
        receiptImageUrl: null, // updated asynchronously after upload
        pricing: {
          servicePrice,
          depositAmount,
          totalAmount: totalPrice,
          currency: 'NGN',
        },
        notes,
      });
    } catch (error) {
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await findIdempotentBooking(providerId, idempotencyKey, { requireClaims: true });
        if (existing) {
          return res.status(200).json({ booking: existing, idempotent: true });
        }
        return res.status(409).json({
          message: 'A booking with this key is still being processed. Please retry.',
          code: 'SLOT_UNAVAILABLE',
        });
      }
      throw error;
    }

    const claim = await claimSlot({
      providerId,
      bookingId: booking._id,
      startAt: slot.startAt,
      endAt: slot.endAt,
      expiresAt: holdExpiresAt,
    });

    if (!claim.ok) {
      await Booking.deleteOne({ _id: booking._id });
      const availability = await availabilityPayload(context, serviceId, requestedStart);
      return res.status(409).json({
        message: 'That slot was just taken by another booking. Please choose another time.',
        code: 'SLOT_UNAVAILABLE',
        reason: 'taken',
        date: availability?.date,
        timezone: availability?.timezone,
        alternatives: availability?.alternatives || [],
      });
    }

    const transactionReference = `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    try {
      // Create transaction record
      await Transaction.create({
        booking: booking._id,
        provider: providerId,
        type: paymentType === 'deposit' ? 'deposit' : 'payment',
        // Amount this payment step must collect (deposit or full price).
        amount: expectedPayment,
        currency: 'NGN',
        paymentGateway: paymentMethod,
        gatewayReference: transactionReference,
        transactionReference,
        customerEmail: customer.email || '',
        status: 'pending',
      });
    } catch (error) {
      // Never leave a booking that owns the calendar with no payment record.
      await releaseSlot(booking._id, 'transaction-create-failed').catch(() => {});
      await Booking.deleteOne({ _id: booking._id }).catch(() => {});
      throw error;
    }

    // Send response immediately — don't wait for Cloudinary or emails
    res.status(201).json({ booking, holdExpiresAt });

    // --- BACKGROUND TASKS (after response sent) ---

    // Upload receipt to Cloudinary in background
    if (hasReceipt) {
      uploadImage(receiptImage, 'nile-booking/receipts')
        .then((uploadResult) => {
          Booking.findByIdAndUpdate(booking._id, { receiptImageUrl: uploadResult.url }).catch(() => {});
        })
        .catch((err) => console.error('Background receipt upload error:', err));
    }

    // Send Emails asynchronously
    User.findById(providerId).then((providerUser) => {
      const localStart = DateTime.fromJSDate(new Date(slot.startAt), { zone: context.schedule.timezone });
      const bookingDateStr = localStart.toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const bookingRef = booking.bookingNumber;

      // Email to Customer (only if email provided)
      if (customer.email) {
        sendEmail({
          to: customer.email,
          subject: `Booking Received — ${service.name} | Nile Booking`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
              <div style="background:#18181b;padding:24px 28px;">
                <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Booking Received ✅</p>
                <p style="color:#a1a1aa;font-size:13px;margin:6px 0 0;">Ref: ${bookingRef}</p>
              </div>
              <div style="padding:28px;">
                <p style="font-size:14px;color:#3f3f46;margin:0 0 20px;">Hi <b>${customer.name}</b>, your booking has been received and is awaiting confirmation.</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;width:40%;">Service</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${service.name}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Date</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${bookingDateStr}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Time</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${localStart.toFormat('HH:mm')} (${context.schedule.timezone})</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Amount</td><td style="padding:10px 0;color:#18181b;font-weight:600;">₦${servicePrice.toLocaleString()}</td></tr>
                  <tr><td style="padding:10px 0;color:#71717a;">Provider</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${providerUser?.businessName || providerUser?.name || 'Your provider'}</td></tr>
                </table>
                ${paymentMethod === 'bank_transfer' ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;font-size:12px;color:#166534;margin-bottom:20px;">We are reviewing your bank transfer receipt. You will be notified once confirmed.</div>' : ''}
                <p style="font-size:12px;color:#a1a1aa;margin:0;">Powered by <a href="https://nilebooking.co" style="color:#18181b;font-weight:600;">Nile Booking</a></p>
              </div>
            </div>
          `,
        });
      }

      // Email to Merchant (always fires if provider has email)
      if (providerUser && providerUser.email) {
        sendEmail({
          to: providerUser.email,
          subject: `New Booking — ${service.name} from ${customer.name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
              <div style="background:#18181b;padding:24px 28px;">
                <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">New Booking 📅</p>
                <p style="color:#a1a1aa;font-size:13px;margin:6px 0 0;">Ref: ${bookingRef}</p>
              </div>
              <div style="padding:28px;">
                <p style="font-size:14px;color:#3f3f46;margin:0 0 20px;">Hi <b>${providerUser.businessName || providerUser.name}</b>, you have a new booking.</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;width:40%;">Customer</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${customer.name}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Phone</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${customer.phone}</td></tr>
                  ${customer.email ? `<tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Email</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${customer.email}</td></tr>` : ''}
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Service</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${service.name}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Date</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${bookingDateStr}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Time</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${localStart.toFormat('HH:mm')} (${context.schedule.timezone})</td></tr>
                  <tr><td style="padding:10px 0;color:#71717a;">Amount</td><td style="padding:10px 0;color:#18181b;font-weight:600;">₦${servicePrice.toLocaleString()}</td></tr>
                </table>
                <a href="https://app.nilebooking.co/dashboard/bookings" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">View in Dashboard →</a>
                <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0;">Powered by <a href="https://nilebooking.co" style="color:#18181b;font-weight:600;">Nile Booking</a></p>
              </div>
            </div>
          `,
        });
      }
    }).catch(err => console.error("Error fetching provider for email:", err));

    // (response already sent above before background tasks)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get provider bookings
// @route   GET /api/bookings
// @access  Private (Provider)
export const getBookings = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json({
        bookings: [
          {
            _id: 'bk_1',
            bookingNumber: 'BK-849302',
            customer: { name: 'Adeola Johnson', email: 'adeola@example.com', phone: '+2348123456789' },
            service: { _id: 's1', name: 'Skin Fade & Beard Trim', price: 15000, duration: 1 },
            date: new Date().toISOString(),
            timeSlot: { startTime: '10:00', endTime: '11:00' },
            status: 'confirmed',
            paymentStatus: 'confirmed',
            pricing: { servicePrice: 15000, totalAmount: 15000 },
          },
          {
            _id: 'bk_2',
            bookingNumber: 'BK-774920',
            customer: { name: 'Chukwu Emeka', email: 'chukwu@example.com', phone: '+2348123456790' },
            service: { _id: 's2', name: 'Beard Trim & Shape', price: 12000, duration: 1 },
            date: new Date(Date.now() - 86400000).toISOString(),
            timeSlot: { startTime: '14:00', endTime: '15:00' },
            status: 'pending',
            paymentStatus: 'awaiting_payment',
            pricing: { servicePrice: 12000, totalAmount: 12000 },
          },
        ],
        totalPages: 1,
        currentPage: 1,
        total: 2,
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { provider: req.user._id };
    if (status) query.status = status;

    const limitNum = Number(limit) || 20;
    const pageNum = Number(page) || 1;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'name description price duration')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    if (getMockMode()) {
      return res.json({ bookings: [], totalPages: 1, currentPage: 1, total: 0 });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (Provider)
export const getBooking = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json({
        _id: req.params.id,
        bookingNumber: 'BK-849302',
        customer: { name: 'Adeola Johnson', email: 'adeola@example.com', phone: '+2348123456789' },
        service: { _id: 's1', name: 'Skin Fade & Beard Trim', price: 15000, duration: 1 },
        date: new Date().toISOString(),
        timeSlot: { startTime: '10:00', endTime: '11:00' },
        status: 'confirmed',
        paymentStatus: 'confirmed',
        pricing: { servicePrice: 15000, totalAmount: 15000 },
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider: req.user._id,
    }).populate('service');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Provider)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (getMockMode()) {
      return res.json({ _id: req.params.id, status });
    }

    if (status === 'confirmed') {
      return res.status(400).json({
        message: 'Bookings are confirmed through payment verification, with a receipt or cash acknowledgment.',
        code: 'PAYMENT_VERIFICATION_REQUIRED',
        verifyEndpoint: `/api/payments/bookings/${req.params.id}/verify`,
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!['cancelled', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        message: 'Unsupported booking status change. Use cancelled, rejected or completed.',
        code: 'INVALID_STATUS',
      });
    }

    booking.status = status;
    if (status !== 'completed') booking.paymentStatus = 'cancelled';
    // The Booking model hook releases this booking's slot claims.
    await booking.save();
    return res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private (Provider)
export const getBookingStats = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json({
        totalBookings: 12,
        confirmedBookings: 8,
        completedBookings: 3,
        pendingBookings: 1,
        totalRevenue: 180000,
        pendingPayouts: 0,
        successRate: 92.5,
      });
    }

    const providerId = req.user._id;

    const [
      totalBookings,
      confirmedBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
    ] = await Promise.all([
      Booking.countDocuments({ provider: providerId }),
      Booking.countDocuments({ provider: providerId, status: 'confirmed' }),
      Booking.countDocuments({ provider: providerId, status: 'completed' }),
      Booking.countDocuments({ provider: providerId, status: 'pending' }),
      Transaction.aggregate([
        { $match: { provider: providerId, status: 'successful' } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: { $subtract: ['$amount', { $ifNull: ['$refundAmount', 0] }] } } 
          } 
        },
      ]),
    ]);

    res.json({
      totalBookings,
      confirmedBookings,
      completedBookings,
      pendingBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayouts: 0,
      successRate: totalBookings > 0 ? parseFloat(((completedBookings / totalBookings) * 100).toFixed(1)) : 0,
    });
  } catch (error) {
    if (getMockMode()) {
      return res.json({
        totalBookings: 12,
        confirmedBookings: 8,
        completedBookings: 3,
        pendingBookings: 1,
        totalRevenue: 180000,
        pendingPayouts: 0,
        successRate: 92.5,
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
