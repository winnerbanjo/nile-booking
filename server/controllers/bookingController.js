import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import { notifyPaymentConfirmation, notifyBookingCancellation } from '../services/notificationService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { getMockMode, mockServices } from '../utils/mockMode.js';

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
        provider: 'mock_user_barber_id_123',
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

    let receiptImageUrl = null;
    if (paymentType === 'bank_transfer' && receiptImage) {
      try {
        const uploadResult = await uploadImage(receiptImage, 'nile-booking/receipts');
        receiptImageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Receipt upload error:', uploadError);
      }
    }

    const booking = await Booking.create({
      customer,
      provider: service.provider,
      service: serviceId,
      date: new Date(date),
      timeSlot,
      status: 'pending',
      paymentStatus: 'pending',
      paymentType: paymentType || 'bank_transfer',
      receiptImage: receiptImageUrl,
      pricing: {
        servicePrice,
        depositAmount,
        totalAmount: servicePrice,
        currency: 'NGN',
      },
      notes,
    });

    res.status(201).json({
      booking,
      paymentData: null,
    });
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
        { $match: { provider: providerId, status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
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
