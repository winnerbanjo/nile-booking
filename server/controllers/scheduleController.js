import Schedule from '../models/Schedule.js';
import { getMockMode, mockSchedules, mockUsers } from '../utils/mockMode.js';
import { isValidTimezone, DEFAULT_BOOKING_WINDOW_DAYS, DEFAULT_MINIMUM_LEAD_TIME_MINUTES, MAX_BOOKING_WINDOW_DAYS } from '../services/availabilityService.js';
import jwt from 'jsonwebtoken';

const parseMinutes = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
};

const parseWindowDays = (value, fallback) => {
  const parsed = parseMinutes(value, fallback);
  if (parsed < 1) return fallback;
  return Math.min(MAX_BOOKING_WINDOW_DAYS, parsed);
};

const parseUnavailableDates = (value) => {
  if (!Array.isArray(value)) return null;
  const cleaned = [];
  for (const entry of value) {
    const start = entry?.date ? new Date(entry.date) : null;
    if (!start || Number.isNaN(start.getTime())) {
      return { error: 'Each blocked date needs a valid date.' };
    }
    let end = null;
    if (entry.endDate) {
      end = new Date(entry.endDate);
      if (Number.isNaN(end.getTime())) return { error: 'Blocked range end date is not valid.' };
      if (end < start) return { error: 'Blocked range end must be on or after its start.' };
    }
    cleaned.push({ date: start, endDate: end, reason: typeof entry.reason === 'string' ? entry.reason : '' });
  }
  return { value: cleaned };
};

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
        bookingWindowDays: DEFAULT_BOOKING_WINDOW_DAYS,
        minimumLeadTimeMinutes: DEFAULT_MINIMUM_LEAD_TIME_MINUTES,
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
    const {
      weeklySchedule,
      bufferTime,
      timezone,
      unavailableDates,
      bookingWindowDays,
      minimumLeadTimeMinutes,
    } = req.body;

    if (getMockMode()) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let userId = 'mock_user_barber_id_123';
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          userId = decoded.id;
        } catch (e) {}
      }
      let mockSched = mockSchedules.get(userId) || { ...defaultMockSchedule };
      if (weeklySchedule) mockSched.weeklySchedule = weeklySchedule;
      if (bufferTime !== undefined) mockSched.bufferTime = bufferTime;
      if (timezone) mockSched.timezone = timezone;
      if (unavailableDates) mockSched.unavailableDates = unavailableDates;
      if (bookingWindowDays !== undefined) mockSched.bookingWindowDays = bookingWindowDays;
      if (minimumLeadTimeMinutes !== undefined) mockSched.minimumLeadTimeMinutes = minimumLeadTimeMinutes;
      mockSchedules.set(userId, mockSched);
      return res.json(mockSched);
    }

    if (timezone !== undefined && !isValidTimezone(timezone)) {
      return res.status(400).json({ message: 'Unknown timezone. Use an IANA timezone such as Africa/Lagos.' });
    }

    const blocked = parseUnavailableDates(unavailableDates);
    if (blocked?.error) {
      return res.status(400).json({ message: blocked.error });
    }

    let schedule = await Schedule.findOne({ provider: req.user._id });

    if (!schedule) {
      schedule = await Schedule.create({
        provider: req.user._id,
        weeklySchedule: weeklySchedule || {},
        bufferTime: bufferTime !== undefined ? bufferTime : 15,
        timezone: timezone || 'Africa/Lagos',
        unavailableDates: blocked?.value || [],
        bookingWindowDays: parseWindowDays(bookingWindowDays, DEFAULT_BOOKING_WINDOW_DAYS),
        minimumLeadTimeMinutes: parseMinutes(minimumLeadTimeMinutes, DEFAULT_MINIMUM_LEAD_TIME_MINUTES),
      });
    } else {
      if (weeklySchedule) schedule.weeklySchedule = weeklySchedule;
      if (bufferTime !== undefined) schedule.bufferTime = bufferTime;
      if (timezone) schedule.timezone = timezone;
      if (blocked) schedule.unavailableDates = blocked.value;
      if (bookingWindowDays !== undefined) {
        schedule.bookingWindowDays = parseWindowDays(bookingWindowDays, schedule.bookingWindowDays);
      }
      if (minimumLeadTimeMinutes !== undefined) {
        schedule.minimumLeadTimeMinutes = parseMinutes(minimumLeadTimeMinutes, schedule.minimumLeadTimeMinutes);
      }

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
    const demoSlugs = ['the-modern-chef', 'glamour-mua', 'elite-hair-studio', 'zenith-photography'];
    const isDemo = demoSlugs.includes(req.params.slug);

    if (getMockMode() || isDemo) {
      if (mockUsers.size === 0) {
        const { initializeMockData } = await import('../utils/mockMode.js');
        initializeMockData();
      }

      const mockUser = Array.from(mockUsers.values()).find((u) => u.slug === req.params.slug) || Array.from(mockUsers.values())[0];
      const mockSched = mockSchedules.get(mockUser._id) || defaultMockSchedule;
      return res.json(mockSched);
    }

    const User = (await import('../models/User.js')).default;
    const provider = await User.findOne({ slug: req.params.slug }).lean();

    if (!provider) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    let schedule = await Schedule.findOne({ provider: provider._id }).lean();

    if (!schedule) {
      schedule = {
        provider: provider._id,
        timezone: 'Africa/Lagos',
        bufferTime: 15,
        bookingWindowDays: DEFAULT_BOOKING_WINDOW_DAYS,
        minimumLeadTimeMinutes: DEFAULT_MINIMUM_LEAD_TIME_MINUTES,
        unavailableDates: [],
        weeklySchedule: {
          monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
          sunday: { enabled: false, timeSlots: [] },
        },
      };
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
