import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { getMockMode } from '../utils/mockMode.js';

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Admin only
export const getAdminStats = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json({
        gmv: 4850000,
        nileRevenue: 485000,
        pendingTransfers: 3,
        activeProviders: 42,
        totalCustomers: 1250,
        totalBookings: 320,
        recentProviders: [
          { _id: 'mock_1', name: 'James Stylist', businessName: 'James Cuts', email: 'james@example.com', createdAt: new Date().toISOString() },
          { _id: 'mock_2', name: 'Sarah Beauty', businessName: 'Sarah Spa', email: 'sarah@example.com', createdAt: new Date().toISOString() }
        ]
      });
    }

    const gmvResult = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$pricing.totalAmount' },
        },
      },
    ]);

    const totalGMV = gmvResult.length > 0 ? gmvResult[0].totalGMV : 0;
    const nileRevenue = totalGMV * 0.1;

    const pendingTransfers = await Booking.countDocuments({
      paymentStatus: 'pending_verification',
      receiptImage: { $ne: null },
    });

    const activeProviders = await User.countDocuments({ role: 'provider' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments();
    
    const recentProviders = await User.find({ role: 'provider' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name businessName email createdAt phone')
      .lean();

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
    if (getMockMode()) {
      return res.json({
        gmv: 4850000,
        nileRevenue: 485000,
        pendingTransfers: 3,
        activeProviders: 42,
        totalCustomers: 1250,
        totalBookings: 320,
        recentProviders: [],
      });
    }
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
    if (getMockMode()) {
      return res.json({
        bookings: [
          {
            _id: 'ver_1',
            bookingNumber: 'BK-994820',
            customer: { name: 'David Oladipo', phone: '+2348123456789' },
            service: { name: 'VIP Skin Fade & Beard Sculpting' },
            provider: { businessName: 'The Modern Barber' },
            pricing: { totalAmount: 15000 },
            receiptImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&fit=crop',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const bookings = await Booking.find({
      paymentStatus: 'pending_verification',
      receiptImage: { $ne: null },
    })
      .populate('provider', 'businessName email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ bookings });
  } catch (error) {
    if (getMockMode()) {
      return res.json({ bookings: [] });
    }
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

    if (getMockMode()) {
      return res.json({
        message: action === 'approve' ? 'Receipt verified and booking confirmed' : 'Receipt rejected',
        booking: { _id: bookingId, status: action === 'approve' ? 'confirmed' : 'rejected' },
      });
    }

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
    
    // Calculate some basic mock stats for each provider if real ones aren't available
    const enrichedProviders = providers.map(p => ({
      ...p,
      city: p.location || p.address?.city || 'Unknown',
      rating: 4.5,
      totalBookings: 0,
      totalRevenue: 0,
      status: p.isActive ? 'Active' : 'Suspended'
    }));

    res.json(enrichedProviders);
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
