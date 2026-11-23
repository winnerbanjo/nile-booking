import Booking from '../models/Booking.js';
import SlotClaim from '../models/SlotClaim.js';
import Transaction from '../models/Transaction.js';
import Schedule from '../models/Schedule.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { sendBookingReceivedEmails, bookingPortalUrl } from '../services/notificationService.js';
import { validateReceiptDataUrl, ReceiptValidationError } from '../utils/receipt.js';
import { logEvent } from '../utils/logger.js';
import { getMockMode, mockServices } from '../utils/mockMode.js';
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
import {
  PaymentLifecycleError,
  cancelBooking,
  completeBooking,
  computeBookingAmounts,
  rejectBooking,
} from '../services/paymentLifecycleService.js';
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
  const existing = await Booking.findOne({ provider: providerId, idempotencyKey }).select('+publicToken').lean();
  if (!existing) return null;
  if (!requireClaims) return existing;
  // During a create race, only return a booking that actually owns its slot;
  // otherwise the other request is about to roll it back and return a 409.
  const claims = await SlotClaim.countDocuments({ booking: existing._id });
  return claims > 0 ? existing : null;
};

const PUBLIC_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

// The token belongs in the URL only, not in provider/customer booking objects.
const withoutPublicToken = (booking) => {
  const plain = booking?.toObject ? booking.toObject() : { ...booking };
  delete plain.publicToken;
  return plain;
};

const findBookingByPublicToken = (token) =>
  Booking.findOne({ publicToken: String(token || '').toLowerCase() })
    .select('+publicToken')
    .populate('service', 'name description price duration')
    .populate('provider', 'name businessName phone email bankAccount paymentMethods');

const publicBookingPayload = async (booking) => {
  const providerId = booking.provider?._id || booking.provider;
  const schedule = await Schedule.findOne({ provider: providerId }).lean();
  const timezone = schedule?.timezone || 'UTC';
  const start = booking.startAt ? DateTime.fromJSDate(new Date(booking.startAt), { zone: timezone }) : null;
  const bank = booking.provider?.bankAccount;
  const bankDetailsAvailable = Boolean(bank?.accountNumber && bank?.accountName);
  const awaitingPayment =
    booking.status === 'pending' &&
    booking.paymentStatus === 'awaiting_payment' &&
    booking.paymentMethod === 'bank_transfer';
  const total = Number(booking.totalPrice) || Number(booking.pricing?.totalAmount) || 0;
  const deposit = Number(booking.depositAmount) || Number(booking.pricing?.depositAmount) || 0;

  return {
    reference: booking.bookingNumber,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    service: {
      name: booking.service?.name || 'Appointment',
      duration: booking.service?.duration || null,
    },
    startAt: booking.startAt || booking.date,
    endAt: booking.endAt || null,
    timeSlot: booking.timeSlot,
    timezone,
    dateLabel: start ? start.toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null,
    timeLabel: booking.timeSlot
      ? `${booking.timeSlot.startTime}-${booking.timeSlot.endTime} (${timezone})`
      : null,
    amount: {
      total,
      deposit,
      dueNow: booking.paymentType === 'deposit' ? deposit : total,
      received: Number(booking.amountReceived) || 0,
      balanceDue: Number(booking.balanceDue) || 0,
      currency: booking.pricing?.currency || 'NGN',
    },
    receipt: {
      uploaded: Boolean(booking.receiptImageUrl),
      status: booking.receiptImageUrl
        ? (booking.paymentStatus === 'confirmed' ? 'verified' : 'awaiting_verification')
        : 'missing',
    },
    provider: {
      name: booking.provider?.businessName || booking.provider?.name || 'Provider',
      phone: booking.provider?.phone || null,
      email: booking.provider?.email || null,
    },
    bankDetails: awaitingPayment && bankDetailsAvailable
      ? {
          bankName: bank.bankName || null,
          accountName: bank.accountName || null,
          accountNumber: bank.accountNumber || null,
        }
      : null,
    holdExpiresAt: booking.holdExpiresAt || null,
    canUploadReceipt: booking.status === 'pending' && booking.paymentMethod === 'bank_transfer',
    canCancel: booking.status === 'pending' || booking.status === 'confirmed',
    portalPath: `/bookings/${booking.publicToken}`,
  };
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

    // Validate before creating a booking or touching object storage.
    if (receiptImage) {
      try {
        validateReceiptDataUrl(receiptImage);
      } catch (error) {
        if (error instanceof ReceiptValidationError) {
          return res.status(error.status).json({ message: error.message, code: error.code });
        }
        throw error;
      }
    }

    if (getMockMode()) {
      const mockService = mockServices.find(s => s._id === serviceId) || mockServices[0];
      const servicePrice = mockService ? mockService.price : 15000;
      const depositAmount = paymentType === 'deposit' ? servicePrice * 0.5 : servicePrice;

      const mockBooking = {
        _id: `booking_${Date.now()}`,
        bookingNumber: `BK-${Date.now().toString().slice(-6)}`,
        publicToken: crypto.randomBytes(32).toString('hex'),
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
        booking: withoutPublicToken(mockBooking),
        paymentData: null,
        portalUrl: bookingPortalUrl(mockBooking.publicToken),
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
        return res.status(200).json({
          booking: withoutPublicToken(existing),
          portalUrl: existing.publicToken ? bookingPortalUrl(existing.publicToken) : null,
          idempotent: true,
        });
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
    const paymentMethods = context.provider.paymentMethods || {};
    if (paymentMethod === 'bank_transfer' && paymentMethods.transfer === false) {
      return res.status(400).json({
        message: 'This business does not accept bank transfers. Please choose another payment method.',
        code: 'PAYMENT_METHOD_DISABLED',
      });
    }
    if (paymentMethod === 'pay_later' && paymentMethods.cash === false) {
      return res.status(400).json({
        message: 'This business does not accept pay-in-person bookings. Please choose another payment method.',
        code: 'PAYMENT_METHOD_DISABLED',
      });
    }
    const bookingPaymentType = ['full', 'deposit', 'pay_later'].includes(paymentType) ? paymentType : 'full';
    const hasReceipt = paymentMethod === 'bank_transfer' && !!receiptImage;
    const paymentStatus = hasReceipt ? 'awaiting_verification' : 'awaiting_payment';
    const holdExpiresAt = computeHoldExpiresAt({ paymentMethod, paymentStatus });
    const servicePrice = service.price;
    const amounts = computeBookingAmounts({ servicePrice, paymentType });
    const { totalPrice, depositAmount, expectedPayment } = amounts;

    // The receipt upload is awaited before responding: Vercel may freeze the
    // function as soon as the response is sent, so background work is unsafe.
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
        totalPrice,
        depositAmount,
        balanceDue: totalPrice,
        notes,
      });
    } catch (error) {
      if (error?.code === 11000 && idempotencyKey) {
        const existing = await findIdempotentBooking(providerId, idempotencyKey, { requireClaims: true });
        if (existing) {
          return res.status(200).json({
            booking: withoutPublicToken(existing),
            portalUrl: existing.publicToken ? bookingPortalUrl(existing.publicToken) : null,
            idempotent: true,
          });
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

    // Work is awaited before responding. Vercel can freeze a function as soon as
    // the response is sent, so fire-and-forget delivery was not reliable.
    let receiptUpload = { status: hasReceipt ? 'pending' : 'not_provided' };
    if (hasReceipt) {
      try {
        const uploadResult = await uploadImage(receiptImage, 'nile-booking/receipts');
        await Booking.updateOne({ _id: booking._id }, { $set: { receiptImageUrl: uploadResult.url } });
        booking.receiptImageUrl = uploadResult.url;
        receiptUpload = { status: 'uploaded' };
      } catch (error) {
        // The booking exists, but there is no evidence. Restore an expiring hold
        // and let the customer retry from the token-gated booking page.
        const fallbackHold = computeHoldExpiresAt({ paymentMethod, paymentStatus: 'awaiting_payment' });
        await Booking.updateOne(
          { _id: booking._id, status: 'pending' },
          { $set: { paymentStatus: 'awaiting_payment', holdExpiresAt: fallbackHold } }
        );
        await SlotClaim.updateMany({ booking: booking._id }, { $set: { expiresAt: fallbackHold } });
        booking.paymentStatus = 'awaiting_payment';
        booking.holdExpiresAt = fallbackHold;
        receiptUpload = {
          status: 'failed',
          error: 'Receipt upload failed. Upload it again from your booking page.',
        };
        console.error(JSON.stringify({
          event: 'receipt_upload_failed',
          correlationId: req.correlationId,
          bookingId: String(booking._id),
          error: error.message,
        }));
      }
    }

    try {
      await sendBookingReceivedEmails(booking._id, { correlationId: req.correlationId });
    } catch (error) {
      // The per-recipient outcome is recorded on the booking and retried by cron.
      console.error(JSON.stringify({
        event: 'booking_email_delivery_error',
        correlationId: req.correlationId,
        bookingId: String(booking._id),
        error: error.message,
      }));
    }

    logEvent('booking_created', {
      correlationId: req.correlationId,
      bookingId: String(booking._id),
      providerId: String(providerId),
      paymentMethod,
      receiptStatus: receiptUpload.status,
    });

    return res.status(201).json({
      booking: withoutPublicToken(booking),
      holdExpiresAt: booking.holdExpiresAt,
      portalUrl: bookingPortalUrl(booking.publicToken),
      receiptUpload,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a booking by its unguessable customer token
// @route   GET /api/bookings/public/:token
// @access  Public (token is the capability)
export const getPublicBooking = async (req, res) => {
  try {
    if (!PUBLIC_TOKEN_PATTERN.test(req.params.token || '')) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = await findBookingByPublicToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    return res.json({ booking: await publicBookingPayload(booking) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', correlationId: req.correlationId });
  }
};

// @desc    Upload/replace a receipt after booking creation
// @route   POST /api/bookings/public/:token/receipt
// @access  Public (token is the capability)
export const uploadPublicReceipt = async (req, res) => {
  try {
    if (!PUBLIC_TOKEN_PATTERN.test(req.params.token || '')) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    let receipt;
    try {
      receipt = validateReceiptDataUrl(req.body?.receiptImage);
    } catch (error) {
      if (error instanceof ReceiptValidationError) {
        return res.status(error.status).json({ message: error.message, code: error.code });
      }
      throw error;
    }

    const booking = await Booking.findOne({ publicToken: req.params.token.toLowerCase() })
      .select('+publicToken');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }
    if (booking.status !== 'pending' || booking.paymentMethod !== 'bank_transfer') {
      return res.status(409).json({
        message: 'This booking does not accept a transfer receipt.',
        code: 'BOOKING_NOT_EDITABLE',
      });
    }

    let uploaded;
    try {
      uploaded = await uploadImage(req.body.receiptImage, 'nile-booking/receipts');
    } catch (error) {
      logEvent('receipt_upload_failed', {
        correlationId: req.correlationId,
        bookingId: String(booking._id),
        bytes: receipt.bytes,
        error: error.message,
      });
      return res.status(502).json({
        message: 'Receipt upload failed. Please try again.',
        code: 'RECEIPT_UPLOAD_FAILED',
      });
    }

    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'pending' },
      {
        $set: {
          receiptImageUrl: uploaded.url,
          paymentStatus: 'awaiting_verification',
          holdExpiresAt: null,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        message: 'This booking changed while the receipt was uploading. Please retry.',
        code: 'BOOKING_NOT_EDITABLE',
      });
    }

    // A receipt is evidence that no longer needs a countdown; keep claims but
    // stop their expiry. Claim/state transitions remain unchanged.
    await SlotClaim.updateMany({ booking: booking._id }, { $set: { expiresAt: null } });

    logEvent('receipt_uploaded', {
      correlationId: req.correlationId,
      bookingId: String(booking._id),
      bytes: receipt.bytes,
      mimeType: receipt.mimeType,
    });

    return res.json({
      success: true,
      paymentStatus: updated.paymentStatus,
      receipt: { uploaded: true, status: 'awaiting_verification' },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', correlationId: req.correlationId });
  }
};

// @desc    Cancel a booking from the token-gated customer page
// @route   POST /api/bookings/public/:token/cancel
// @access  Public (token is the capability)
export const cancelPublicBooking = async (req, res) => {
  try {
    if (!PUBLIC_TOKEN_PATTERN.test(req.params.token || '')) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = await Booking.findOne({ publicToken: req.params.token.toLowerCase() })
      .select('+publicToken');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    const reason = typeof req.body?.reason === 'string'
      ? req.body.reason.slice(0, 500)
      : 'Cancelled by customer';

    try {
      const result = await cancelBooking({
        bookingId: booking._id,
        actor: { role: 'customer' },
        reason,
        allowCustomer: true,
      });

      logEvent('booking_cancelled_by_customer', {
        correlationId: req.correlationId,
        bookingId: String(booking._id),
      });

      return res.json({
        success: true,
        status: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
      });
    } catch (error) {
      if (error instanceof PaymentLifecycleError) {
        return res.status(error.statusCode).json({ message: error.message, code: error.code, ...error.details });
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', correlationId: req.correlationId });
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

    const reason = typeof req.body.reason === 'string' ? req.body.reason : '';
    try {
      if (status === 'cancelled') {
        const result = await cancelBooking({ bookingId: req.params.id, actor: req.user, reason });
        return res.json(result.booking);
      }
      if (status === 'rejected') {
        const result = await rejectBooking({ bookingId: req.params.id, actor: req.user, reason });
        return res.json(result.booking);
      }
      if (status === 'completed') {
        const result = await completeBooking({ bookingId: req.params.id, actor: req.user });
        return res.json(result.booking);
      }
    } catch (error) {
      if (error instanceof PaymentLifecycleError) {
        return res.status(error.statusCode).json({ message: error.message, code: error.code, ...error.details });
      }
      throw error;
    }

    return res.status(400).json({
      message: 'Unsupported booking status change. Use cancelled, rejected or completed.',
      code: 'INVALID_STATUS',
    });
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
