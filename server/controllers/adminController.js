import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Admin only (no auth middleware for now, but should be added)
export const getAdminStats = async (req, res) => {
  try {
    // Sum all totalAmount from bookings for GMV
    const gmvResult = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$pricing.totalAmount' },
        },
      },
    ]);

    const totalGMV = gmvResult.length > 0 ? gmvResult[0].totalGMV : 0;

    // Calculate 10% commission
    const nileRevenue = totalGMV * 0.1;

    // Count pending verification bookings
    const pendingTransfers = await Booking.countDocuments({
      paymentStatus: 'pending_verification',
      receiptImageUrl: { $ne: null },
    });

    // Return stats
    res.json({
      gmv: totalGMV || 0,
      nileRevenue: nileRevenue || 0,
      pendingTransfers: pendingTransfers || 0,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      message: 'Error fetching admin statistics',
      error: error.message,
      // Return zeros as failsafe
      gmv: 0,
      nileRevenue: 0,
      pendingTransfers: 0,
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
      receiptImageUrl: { $ne: null },
    })
      .populate('provider', 'businessName email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ message: 'Error fetching pending verifications', error: error.message });
  }
};

// @desc    Verify receipt and confirm booking
// @route   POST /api/admin/verifications/:bookingId/verify
// @access  Admin only
export const verifyReceipt = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (action === 'approve') {
      // Update booking status to confirmed and payment to paid
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      await booking.save();

      res.json({ 
        message: 'Receipt verified and booking confirmed',
        booking 
      });
    } else if (action === 'reject') {
      // Update booking status to rejected
      booking.status = 'rejected';
      booking.paymentStatus = 'pending';
      await booking.save();

      res.json({ 
        message: 'Receipt rejected',
        booking 
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
    }
  } catch (error) {
    console.error('Error verifying receipt:', error);
    res.status(500).json({ message: 'Error verifying receipt', error: error.message });
  }
};
