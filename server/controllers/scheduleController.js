import Schedule from '../models/Schedule.js';

// @desc    Get schedule
// @route   GET /api/schedule
// @access  Private (Provider)
export const getSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.findOne({ provider: req.user._id });

    if (!schedule) {
      // Create default schedule if doesn't exist
      schedule = await Schedule.create({
        provider: req.user._id,
        weeklySchedule: {
          monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
        },
        bufferTime: 15,
      });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update schedule
// @route   PUT /api/schedule
// @access  Private (Provider)
export const updateSchedule = async (req, res) => {
  try {
    const { weeklySchedule, bufferTime, timezone, unavailableDates } = req.body;

    let schedule = await Schedule.findOne({ provider: req.user._id });

    if (!schedule) {
      schedule = await Schedule.create({
        provider: req.user._id,
        weeklySchedule: weeklySchedule || {},
        bufferTime: bufferTime || 15,
        timezone: timezone || 'UTC',
        unavailableDates: unavailableDates || [],
      });
    } else {
      if (weeklySchedule) schedule.weeklySchedule = weeklySchedule;
      if (bufferTime !== undefined) schedule.bufferTime = bufferTime;
      if (timezone) schedule.timezone = timezone;
      if (unavailableDates) schedule.unavailableDates = unavailableDates;

      await schedule.save();
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get schedule by provider slug (public)
// @route   GET /api/schedule/provider/:slug
// @access  Public
export const getScheduleBySlug = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const provider = await User.findOne({ slug: req.params.slug });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const schedule = await Schedule.findOne({ provider: provider._id });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
