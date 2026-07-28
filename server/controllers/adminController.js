import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Transaction from '../models/Transaction.js';

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Admin only
export const getAdminStats = async (req, res) => {
  try {
    const [gmvResult, pendingTransfers, activeProviders, totalCustomers, totalBookings, recentProviders] = await Promise.all([
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalGMV: { $sum: '$pricing.totalAmount' },
          },
        },
      ]),
      Booking.countDocuments({
        paymentStatus: 'pending_verification',
        receiptImage: { $ne: null },
      }),
      User.countDocuments({ role: 'provider' }),
      User.countDocuments({ role: 'customer' }),
      Booking.countDocuments(),
      User.find({ role: 'provider' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name businessName email createdAt phone')
        .lean(),
    ]);

    const totalGMV = gmvResult.length > 0 ? gmvResult[0].totalGMV : 0;
    const nileRevenue = totalGMV * 0.1;

    res.json({
      gmv: totalGMV || 0,
      nileRevenue: nileRevenue || 0,
      pendingTransfers: pendingTransfers || 0,
      activeProviders: activeProviders || 0,
      totalCustomers: totalCustomers || 0,
      totalBookings: totalBookings || 0,
      recentProviders: recentProviders || [],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching admin statistics',
      error: error.message,
      gmv: 0,
      nileRevenue: 0,
      pendingTransfers: 0,
      activeProviders: 0,
      totalCustomers: 0,
      totalBookings: 0,
      recentProviders: [],
    });
  }
};

// @desc    Get pending receipt verifications
// @route   GET /api/admin/verifications
// @access  Admin only
export const getPendingVerifications = async (req, res) => {
  try {
    const bookings = await Booking.find({
      paymentStatus: 'pending_verification',
      receiptImage: { $ne: null },
    })
      .populate('provider', 'businessName email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending verifications', error: error.message });
  }
};

// @desc    Verify receipt and confirm booking
// @route   POST /api/admin/verifications/:bookingId/verify
// @access  Admin only
export const verifyReceipt = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (action === 'approve') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      await booking.save();
      res.json({ message: 'Receipt verified and booking confirmed', booking });
    } else if (action === 'reject') {
      booking.status = 'rejected';
      booking.paymentStatus = 'pending';
      await booking.save();
      res.json({ message: 'Receipt rejected', booking });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying receipt', error: error.message });
  }
};

// @desc    Get all providers
// @route   GET /api/admin/providers
// @access  Admin only
export const getProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' })
      .select('name businessName email phone address location isVerified isActive createdAt')
      .lean();
    
    const enrichedProviders = providers.map(p => ({
      ...p,
      city: p.location || p.address?.city || 'Unknown',
      status: p.isActive ? 'Active' : 'Suspended'
    }));

    res.json({
      data: enrichedProviders || [],
      pagination: { page: 1, limit: enrichedProviders.length, total: enrichedProviders.length, totalPages: 1 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

// @desc    Update provider status
// @route   PUT /api/admin/providers/:providerId/status
// @access  Admin only
export const updateProviderStatus = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.body;
    
    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    if (status === 'Active') {
      provider.isActive = true;
    } else if (status === 'Suspended') {
      provider.isActive = false;
    }
    
    await provider.save();
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: 'Error updating provider status', error: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/admin/bookings
// @access  Admin only
export const getAdminBookings = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('provider', 'businessName name email')
        .populate('service', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.json({
      data: bookings || [],
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin bookings', error: error.message });
  }
};

// @desc    Get all customers (Admin)
// @route   GET /api/admin/customers
// @access  Admin only
export const getAdminCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { role: 'customer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      User.find(query)
        .select('name email phone location isVerified createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      data: customers || [],
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin customers', error: error.message });
  }
};

// @desc    Get all transactions (Admin)
// @route   GET /api/admin/transactions
// @access  Admin only
export const getAdminTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { transactionReference: { $regex: search, $options: 'i' } },
        { gatewayReference: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('provider', 'businessName email')
        .populate('booking', 'bookingNumber pricing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      data: transactions || [],
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin transactions', error: error.message });
  }
};

// @desc    Get all payouts (Admin)
// @route   GET /api/admin/payouts
// @access  Admin only
export const getAdminPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { type: 'payout' };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { transactionReference: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [payouts, total] = await Promise.all([
      Transaction.find(query)
        .populate('provider', 'businessName email name')
        .populate('booking', 'bookingNumber pricing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      data: payouts.map(p => ({
        ...p,
        providerName: p.provider?.businessName || p.provider?.name || p.provider?.email || 'Unknown provider',
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payouts', error: error.message });
  }
};

// @desc    Get all refunds (Admin)
// @route   GET /api/admin/refunds
// @access  Admin only
export const getAdminRefunds = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { type: 'refund' };
    if (search) {
      query.$or = [
        { transactionReference: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [refunds, total] = await Promise.all([
      Transaction.find(query)
        .populate('provider', 'businessName email name')
        .populate('booking', 'bookingNumber pricing status customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      data: refunds.map(r => ({
        ...r,
        providerName: r.provider?.businessName || r.provider?.name || r.provider?.email || 'Unknown provider',
        bookingNumber: r.booking?.bookingNumber || 'N/A',
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching refunds', error: error.message });
  }
};

// @desc    Get admin platform settings
// @route   GET /api/admin/settings
// @access  Admin only
export const getAdminSettings = async (req, res) => {
  try {
    // Settings are platform-level configuration. In this implementation they are
    // stored as environment/config values. Future versions may use a Settings model.
    res.json({
      subscriptionFee: Number(process.env.SUBSCRIPTION_FEE) || 5000,
      payoutDelayDays: Number(process.env.PAYOUT_DELAY_DAYS) || 3,
      highValueThreshold: Number(process.env.HIGH_VALUE_THRESHOLD) || 500000,
      maxRefundWithoutAdmin: Number(process.env.MAX_REFUND_WITHOUT_ADMIN) || 50000,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// @desc    Get disputes and risk data (Admin)
// @route   GET /api/admin/risk
// @access  Admin only
export const getAdminRisk = async (req, res) => {
  try {
    const [disputed, highRisk, totalProviders] = await Promise.all([
      Booking.countDocuments({ status: 'disputed' }),
      User.countDocuments({ role: 'provider', isActive: false }),
      User.countDocuments({ role: 'provider' }),
    ]);

    const recentDisputes = await Booking.find({ status: 'disputed' })
      .populate('provider', 'businessName name email')
      .populate('customer', 'name email')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    res.json({
      data: recentDisputes.map(d => ({
        ...d,
        providerName: d.provider?.businessName || d.provider?.name || d.provider?.email || 'Unknown',
        customerName: d.customer?.name || d.customer?.email || 'Unknown',
      })),
      summary: {
        openDisputes: disputed,
        highRiskProviders: highRisk,
        underInvestigation: 0,
        totalProviders,
      },
      pagination: {
        page: 1,
        limit: 20,
        total: disputed,
        totalPages: Math.ceil(disputed / 20) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching risk data', error: error.message });
  }
};
