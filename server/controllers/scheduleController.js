import Schedule from '../models/Schedule.js';
import { getMockMode, mockSchedules, mockUsers } from '../utils/mockMode.js';
import jwt from 'jsonwebtoken';

const defaultMockSchedule = {
  _id: 'mock_schedule_123',
  provider: 'mock_user_barber_id_123',
  timezone: 'Africa/Lagos',
  bufferTime: 15,
  unavailableDates: [],
  weeklySchedule: {
    monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
    saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
    sunday: { enabled: false, timeSlots: [] },
  },
};

// @desc    Get schedule
// @route   GET /api/schedule
// @access  Private (Provider)
export const getSchedule = async (req, res) => {
  try {
    if (getMockMode()) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let userId = 'mock_user_barber_id_123';
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          userId = decoded.id;
        } catch (e) {}
      }
      const mockSched = mockSchedules.get(userId) || defaultMockSchedule;
      return res.json(mockSched);
    }

    let schedule = await Schedule.findOne({ provider: req.user._id });

    if (!schedule) {
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

    if (getMockMode()) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let userId = 'mock_user_barber_id_123';
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          userId = decoded.id;
        } catch (e) {}
      }
      let mockSched = mockSchedules.get(userId) || defaultMockSchedule;
      if (weeklySchedule) mockSched.weeklySchedule = weeklySchedule;
      if (bufferTime !== undefined) mockSched.bufferTime = bufferTime;
      mockSchedules.set(userId, mockSched);
      return res.json(mockSched);
    }

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
    if (getMockMode()) {
      const mockUser = Array.from(mockUsers.values()).find((u) => u.slug === req.params.slug) || Array.from(mockUsers.values())[0];
      const mockSched = mockSchedules.get(mockUser._id) || defaultMockSchedule;
      return res.json(mockSched);
    }

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
