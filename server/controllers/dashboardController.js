import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import Service from '../models/Service.js';

// @desc    Get merchant dashboard summary in a single query
// @route   GET /api/dashboard/summary
// @access  Private (Merchant/Provider)
export const getDashboardSummary = async (req, res) => {
  try {
    const providerId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      recentBookings,
      upcomingAppointments,
      activeServicesCount,
      totalServicesCount,
      bookingsStats,
      schedule,
    ] = await Promise.all([
      // 1. Recent 6 bookings with projected fields
      Booking.find({ provider: providerId })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('bookingNumber customer service date timeSlot status paymentStatus pricing createdAt')
        .populate('service', 'name price duration')
        .lean(),

      // 2. Today's upcoming appointments
      Booking.find({
        provider: providerId,
        date: { $gte: today },
        status: { $ne: 'cancelled' },
      })
        .sort({ date: 1, 'timeSlot.startTime': 1 })
        .limit(5)
        .select('bookingNumber customer service date timeSlot status paymentStatus pricing')
        .populate('service', 'name price duration')
        .lean(),

      // 3. Count active and total services
      Service.countDocuments({ provider: providerId, isActive: true }),
      Service.countDocuments({ provider: providerId }),

      // 4. Aggregated booking metrics
      Booking.aggregate([
        { $match: { provider: providerId } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
            },
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['confirmed', 'completed']] },
                  '$pricing.totalAmount',
                  0,
                ],
              },
            },
            totalDepositEscrow: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['confirmed', 'completed']] },
                  '$pricing.depositAmount',
                  0,
                ],
              },
            },
            uniqueCustomers: { $addToSet: '$customer.email' },
          },
        },
      ]),

      // 5. Saved availability, used for the setup checklist.
      Schedule.findOne({ provider: providerId }).lean(),
    ]);

    const stats = bookingsStats[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      totalDepositEscrow: 0,
      uniqueCustomers: [],
    };

    const onboarding = req.user.onboarding || {};
    const hasSavedAvailability = Boolean(
      schedule &&
        Object.values(schedule.weeklySchedule || {}).some(
          (day) => day?.enabled && Array.isArray(day.timeSlots) && day.timeSlots.length > 0
        )
    );

    const setup = {
      accountCreated: true,
      websiteGenerated: Boolean(onboarding.websiteGenerated || req.user.slug),
      firstServiceAdded: Boolean(onboarding.firstServiceAdded || totalServicesCount > 0),
      availabilityConfigured: Boolean(onboarding.availabilityConfigured || hasSavedAvailability),
      logoAdded: Boolean(req.user.logo || req.user.profileImage),
      websitePreviewed: Boolean(onboarding.websitePreviewed),
      websiteShared: Boolean(onboarding.websiteShared),
    };

    res.json({
      setup,
      metrics: {
        totalBookings: stats.totalBookings || 0,
        confirmedBookings: stats.confirmedBookings || 0,
        pendingBookings: stats.pendingBookings || 0,
        totalRevenue: stats.totalRevenue || 0,
        totalDepositEscrow: stats.totalDepositEscrow || 0,
        totalCustomers: stats.uniqueCustomers ? stats.uniqueCustomers.length : 0,
        activeServices: activeServicesCount || 0,
      },
      recentBookings: recentBookings || [],
      upcomingAppointments: upcomingAppointments || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading dashboard summary', error: error.message });
  }
};
