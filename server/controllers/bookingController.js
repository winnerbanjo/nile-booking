import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';
import { paystackService, flutterwaveService } from '../services/paymentService.js';
import { generateWhatsAppLink, notifyBookingCancellation } from '../services/notificationService.js';
import { uploadImage } from '../services/cloudinaryService.js';

// @desc    Create booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  try {
    const {
      customer,
      serviceId,
      date,
      timeSlot,
      paymentType,
      notes,
      receiptImage, // Base64 image for bank transfer
    } = req.body;

    // Validation
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ message: 'Customer information is required' });
    }
    if (!serviceId || !date || !timeSlot || !paymentType) {
      return res.status(400).json({ message: 'Service, date, time slot, and payment type are required' });
    }

    // Get service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Calculate pricing
    const servicePrice = service.price;
    const depositAmount = paymentType === 'deposit' ? servicePrice * 0.3 : 0; // 30% deposit
    const totalAmount = paymentType === 'pay_later' ? 0 : (paymentType === 'deposit' ? depositAmount : servicePrice);

    // Handle receipt upload for bank transfer
    let receiptImageUrl = null;
    if (paymentType === 'bank_transfer' && receiptImage) {
      try {
        const uploadResult = await uploadImage(receiptImage, 'nile-booking/receipts');
        receiptImageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Receipt upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload receipt image' });
      }
    }

    // Create booking
    const booking = await Booking.create({
      customer,
      provider: service.provider,
      service: serviceId,
      date: new Date(date),
      timeSlot,
      paymentType,
      pricing: {
        servicePrice,
        depositAmount,
        totalAmount,
        currency: 'NGN',
      },
      notes,
      receiptImageUrl, // Store Cloudinary URL
      status: paymentType === 'bank_transfer' ? 'pending' : (paymentType === 'pay_later' ? 'pending' : 'pending'),
      paymentStatus: paymentType === 'bank_transfer' ? 'pending_verification' : (paymentType === 'pay_later' ? 'pending' : 'pending'),
    });

    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink({
      ...booking.toObject(),
      service: { name: service.name },
    });
    booking.whatsappLink = whatsappLink;
    await booking.save();

    // Initialize payment if needed
    let paymentData = null;
    if (paymentType !== 'pay_later' && totalAmount > 0) {
      const gateway = req.body.paymentGateway || 'paystack';
      const reference = booking.bookingNumber;

      if (gateway === 'paystack') {
        paymentData = await paystackService.initializePayment(
          totalAmount,
          customer.email,
          reference,
          { bookingId: booking._id.toString(), customerName: customer.name }
        );
      } else if (gateway === 'flutterwave') {
        paymentData = await flutterwaveService.initializePayment(
          totalAmount,
          customer.email,
          reference,
          { bookingId: booking._id.toString(), customer: { name: customer.name, phone: customer.phone } }
        );
      }
    }

    res.status(201).json({
      booking,
      paymentData,
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
    const { status, page = 1, limit = 20 } = req.query;
    const query = { provider: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('service', 'name description price duration')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (Provider)
export const getBooking = async (req, res) => {
  try {
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
    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
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

    // Send notification if confirmed or cancelled
    if (status === 'confirmed') {
      const { notifyPaymentConfirmation } = await import('../services/notificationService.js');
      await notifyPaymentConfirmation(booking._id);
    } else if (status === 'cancelled') {
      await notifyBookingCancellation(booking._id, 'provider');
    }

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
    const providerId = req.user._id;

    const [
      totalBookings,
      confirmedBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
      pendingPayouts,
    ] = await Promise.all([
      Booking.countDocuments({ provider: providerId }),
      Booking.countDocuments({ provider: providerId, status: 'confirmed' }),
      Booking.countDocuments({ provider: providerId, status: 'completed' }),
      Booking.countDocuments({ provider: providerId, status: 'pending' }),
      Transaction.aggregate([
        { $match: { provider: providerId, status: 'success', type: { $in: ['payment', 'deposit'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { provider: providerId, status: 'pending', type: 'payout' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const successRate = totalBookings > 0
      ? ((completedBookings / totalBookings) * 100).toFixed(1)
      : 0;

    res.json({
      totalBookings,
      confirmedBookings,
      completedBookings,
      pendingBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      successRate: parseFloat(successRate),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
