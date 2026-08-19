import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { notifyPaymentConfirmation, notifyBookingCancellation } from '../services/notificationService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { getMockMode, mockServices } from '../utils/mockMode.js';
import { sendEmail } from '../utils/email.js';
import { paystackService, flutterwaveService } from '../services/paymentService.js';
import crypto from 'crypto';

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
        paymentStatus: 'pending',
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

    // Database Mode
    let service = null;

    // Try to find service by ID first
    if (serviceId.includes('mock_service') || serviceId.startsWith('s') || serviceId.startsWith('service_mock')) {
      const mockBooking = {
        _id: `booking_${Date.now()}`,
        bookingNumber: `BK-${Date.now().toString().slice(-6)}`,
        customer: {
          name: customer.name,
          email: customer.email || 'client@example.com',
          phone: customer.phone,
        },
        provider: 'mock_provider_id',
        service: {
          _id: serviceId,
          name: 'Mock Service',
          price: 15000,
          duration: 1,
        },
        date: new Date(date).toISOString(),
        timeSlot: timeSlot || { startTime: '10:00', endTime: '11:00' },
        status: 'pending',
        paymentStatus: 'pending',
        paymentType: paymentType || 'bank_transfer',
        receiptImage: receiptImage || null,
        pricing: {
          servicePrice: 15000,
          depositAmount: 15000,
          totalAmount: 15000,
          currency: 'NGN',
        },
        createdAt: new Date().toISOString(),
      };

      return res.status(201).json({
        booking: mockBooking,
        paymentData: null,
      });
    }

    if (serviceId && serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(serviceId);
    }

    // If service not found by ID, try to find via providerSlug (for public storefront bookings)
    if (!service && providerSlug) {
      const User = (await import('../models/User.js')).default;
      const provider = await User.findOne({ slug: providerSlug }).lean();
      if (provider) {
        service = await Service.findOne({ provider: provider._id, isActive: true });
      }
    }

    if (!service) {
      return res.status(404).json({ message: 'Service not found. Please refresh and try again.' });
    }

    const servicePrice = service.price;
    const depositAmount = paymentType === 'deposit' ? servicePrice * 0.5 : servicePrice;

    // NOTE: We do NOT await Cloudinary here — it would exceed Vercel's function timeout.
    // The booking is created immediately; the receipt uploads in the background.
    const hasReceipt = paymentType === 'bank_transfer' && !!receiptImage;

    const booking = await Booking.create({
      customer,
      provider: service.provider,
      service: serviceId,
      date: new Date(date),
      timeSlot,
      status: 'pending',
      paymentStatus: hasReceipt ? 'awaiting_verification' : 'awaiting_payment',
      paymentType: 'bank_transfer',
      receiptImageUrl: null, // updated asynchronously after upload
      pricing: {
        servicePrice,
        depositAmount,
        totalAmount: servicePrice,
        currency: 'NGN',
      },
      notes,
    });

    const transactionReference = `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create transaction record
    await Transaction.create({
      booking: booking._id,
      provider: service.provider,
      type: 'payment',
      amount: servicePrice,
      currency: 'NGN',
      paymentGateway: 'bank_transfer',
      gatewayReference: transactionReference,
      transactionReference,
      customerEmail: customer.email || '',
      status: 'pending',
    });

    // Send response immediately — don't wait for Cloudinary or emails
    res.status(201).json({ booking });

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
    User.findById(service.provider).then((providerUser) => {
      const bookingDateStr = new Date(date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Time</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${timeSlot.startTime}</td></tr>
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Amount</td><td style="padding:10px 0;color:#18181b;font-weight:600;">₦${servicePrice.toLocaleString()}</td></tr>
                  <tr><td style="padding:10px 0;color:#71717a;">Provider</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${providerUser?.businessName || providerUser?.name || 'Your provider'}</td></tr>
                </table>
                ${paymentType === 'bank_transfer' ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;font-size:12px;color:#166534;margin-bottom:20px;">We are reviewing your bank transfer receipt. You will be notified once confirmed.</div>' : ''}
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
                  <tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:10px 0;color:#71717a;">Time</td><td style="padding:10px 0;color:#18181b;font-weight:600;">${timeSlot.startTime}</td></tr>
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
            paymentStatus: 'paid',
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
            paymentStatus: 'pending',
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
        paymentStatus: 'paid',
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

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider: req.user._id,
    }).populate('service');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (status === 'cancelled') {
      booking.paymentStatus = 'cancelled';
      // We no longer automatically change transaction status to refunded.
      // Revenue is only deducted if an actual manual refund is processed via the refund endpoint.
    }

    await booking.save();
    res.json(booking);
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
