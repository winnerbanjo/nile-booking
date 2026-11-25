import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import Service from '../models/Service.js';
import SlotClaim from '../models/SlotClaim.js';
import User from '../models/User.js';

/**
 * Server-side availability authority.
 *
 * All slot math happens here, in the provider's timezone, using luxon. Slots are
 * emitted and stored as UTC instants. The storefront never computes slots.
 *
 * Slot lifecycle / public helpers (Prompt 2 can call these):
 *   - computeHoldExpiresAt(input)     -> Date|null for a new booking
 *   - claimSlot(input)                -> atomic overlap-safe claim
 *   - releaseSlot(bookingId, reason)  -> frees a cancelled/rejected booking
 *   - confirmSlot(bookingId)          -> makes a claim permanent (never expires)
 *   - releaseExpiredHolds(providerId) -> lazy sweep of expired pending holds
 */

export const ACTIVE_BOOKING_STATUSES = Object.freeze(['pending', 'confirmed']);

/** The single source of truth for "does this booking occupy the calendar". */
export const isActiveBookingStatus = (status) => ACTIVE_BOOKING_STATUSES.includes(status);

export const DEFAULT_BOOKING_WINDOW_DAYS = 60;
export const DEFAULT_MINIMUM_LEAD_TIME_MINUTES = 0;
export const MAX_BOOKING_WINDOW_DAYS = 365;

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MINUTE_MS = 60 * 1000;
const MAX_BOOKING_MINUTES = 24 * 60;

const DEFAULT_WEEKLY_SCHEDULE = () => {
  const weekday = { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] };
  return {
    monday: { ...weekday },
    tuesday: { ...weekday },
    wednesday: { ...weekday },
    thursday: { ...weekday },
    friday: { ...weekday },
    saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
    sunday: { enabled: false, timeSlots: [] },
  };
};

export class AvailabilityError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = 'AvailabilityError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const envNumber = (name, fallback, { allowZero = true } = {}) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) return fallback;
  return value;
};

/** Hold policy. Defaults are overridable per environment. */
export const getHoldConfig = () => ({
  holdMinutes: envNumber('HOLD_MINUTES', 30),
  cashHoldHours: envNumber('CASH_HOLD_HOURS', 24),
});

/**
 * When an unpaid pending booking stops occupying the calendar.
 * A receipt (awaiting verification) or pay-in-person keeps the hold per policy.
 */
export const computeHoldExpiresAt = ({
  paymentMethod,
  paymentStatus,
  from = new Date(),
}) => {
  if (paymentStatus === 'awaiting_verification') return null;
  const { holdMinutes, cashHoldHours } = getHoldConfig();
  if (paymentMethod === 'pay_later') {
    return new Date(from.getTime() + cashHoldHours * 60 * MINUTE_MS);
  }
  return new Date(from.getTime() + holdMinutes * MINUTE_MS);
};

export const isValidTimezone = (timezone) =>
  typeof timezone === 'string' && DateTime.now().setZone(timezone).isValid;

const resolveTimezone = (timezone) => (isValidTimezone(timezone) ? timezone : 'UTC');

const toDateTime = (value, zone) => {
  if (!value) return null;
  if (value instanceof Date) return DateTime.fromJSDate(value, { zone });
  if (typeof value === 'object' && value.$date) return DateTime.fromJSDate(new Date(value.$date), { zone });
  return DateTime.fromISO(String(value), { zone });
};

const normalizeUnavailableDates = (unavailableDates = []) => {
  if (!Array.isArray(unavailableDates)) return [];
  return unavailableDates
    .map((entry) => {
      const start = entry?.date ? new Date(entry.date) : null;
      if (!start || Number.isNaN(start.getTime())) return null;
      const end = entry?.endDate ? new Date(entry.endDate) : null;
      return {
        date: start,
        endDate: end && !Number.isNaN(end.getTime()) ? end : null,
        reason: entry?.reason || '',
      };
    })
    .filter(Boolean);
};

export const normalizeSchedule = (schedule, providerId) => {
  const timezone = resolveTimezone(schedule?.timezone);
  const weeklySchedule = schedule?.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE();
  const bookingWindowDays = Math.min(
    MAX_BOOKING_WINDOW_DAYS,
    Math.max(1, Number(schedule?.bookingWindowDays) || DEFAULT_BOOKING_WINDOW_DAYS)
  );
  const minimumLeadTimeMinutes = Math.max(
    0,
    Number(schedule?.minimumLeadTimeMinutes) || 0
  );

  return {
    provider: schedule?.provider || providerId,
    timezone,
    weeklySchedule,
    bufferTime: Math.max(0, Number(schedule?.bufferTime) || 0),
    bookingWindowDays,
    minimumLeadTimeMinutes,
    unavailableDates: normalizeUnavailableDates(schedule?.unavailableDates),
  };
};

const blockedDayKeys = (schedule) => {
  const keys = new Set();
  for (const entry of schedule.unavailableDates) {
    const start = DateTime.fromJSDate(new Date(entry.date), { zone: schedule.timezone }).startOf('day');
    if (!start.isValid) continue;
    const end = entry.endDate
      ? DateTime.fromJSDate(new Date(entry.endDate), { zone: schedule.timezone }).startOf('day')
      : start;
    let cursor = start;
    let guard = 0;
    while (cursor <= end && guard < MAX_BOOKING_WINDOW_DAYS + 1) {
      keys.add(cursor.toISODate());
      cursor = cursor.plus({ days: 1 });
      guard += 1;
    }
  }
  return keys;
};

const parseLocalMinutes = (time, dayKey, zone) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = DateTime.fromFormat(`${dayKey} ${time}`, 'yyyy-MM-dd HH:mm', { zone });
  return parsed.isValid ? parsed : null;
};

/**
 * Every grid start the schedule allows on a provider-local day.
 * Grid step is service duration + buffer, anchored at each weekly range start.
 */
export const buildDayCandidates = ({ schedule, durationMinutes, dayKey }) => {
  const zone = schedule.timezone;
  const day = DateTime.fromISO(dayKey, { zone, setZone: true });
  if (!day.isValid) return [];

  const daySchedule = schedule.weeklySchedule?.[DAY_KEYS[day.weekday % 7]];
  if (!daySchedule?.enabled || !Array.isArray(daySchedule.timeSlots)) return [];

  const step = durationMinutes + schedule.bufferTime;
  if (!Number.isFinite(step) || step <= 0) return [];

  const candidates = [];
  for (const range of daySchedule.timeSlots) {
    let cursor = parseLocalMinutes(range.startTime, dayKey, zone);
    const rangeEnd = parseLocalMinutes(range.endTime, dayKey, zone);
    if (!cursor || !rangeEnd || rangeEnd <= cursor) continue;

    while (cursor.plus({ minutes: durationMinutes }) <= rangeEnd) {
      candidates.push({
        startAt: cursor.toUTC().toJSDate(),
        endAt: cursor.plus({ minutes: durationMinutes }).toUTC().toJSDate(),
        localStart: cursor.toFormat('HH:mm'),
        localEnd: cursor.plus({ minutes: durationMinutes }).toFormat('HH:mm'),
      });
      cursor = cursor.plus({ minutes: step });
    }
  }
  return candidates;
};

const padInterval = (interval, bufferMinutes) => ({
  start: interval.start.getTime() - bufferMinutes * MINUTE_MS,
  end: interval.end.getTime() + bufferMinutes * MINUTE_MS,
});

const intervalsOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const legacyInterval = (booking, zone) => {
  if (booking.startAt && booking.endAt) {
    return { start: new Date(booking.startAt), end: new Date(booking.endAt) };
  }
  if (!booking.date || !booking.timeSlot?.startTime || !booking.timeSlot?.endTime) return null;
  const day = DateTime.fromJSDate(new Date(booking.date), { zone });
  if (!day.isValid) return null;
  const dayKey = day.toISODate();
  const start = parseLocalMinutes(booking.timeSlot.startTime, dayKey, zone);
  const end = parseLocalMinutes(booking.timeSlot.endTime, dayKey, zone);
  if (!start || !end || end <= start) return null;
  return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() };
};

export const isExpiredHold = (booking, now = new Date()) =>
  booking.status === 'pending' &&
  booking.holdExpiresAt != null &&
  new Date(booking.holdExpiresAt).getTime() <= now.getTime();

/**
 * Active bookings that occupy the calendar in [from, to), including legacy
 * bookings that predate startAt/endAt.
 */
export const getOccupiedIntervals = async ({ providerId, schedule, from, to, now = new Date() }) => {
  const zone = schedule.timezone;
  const [modern, legacy] = await Promise.all([
    Booking.find({
      provider: providerId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      startAt: { $ne: null, $lt: to },
      endAt: { $gt: from },
    })
      .select('startAt endAt status holdExpiresAt customer.name')
      .lean(),
    Booking.find({
      provider: providerId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      startAt: null,
      date: {
        $gte: new Date(from.getTime() - 2 * 24 * 60 * MINUTE_MS),
        $lt: new Date(to.getTime() + 2 * 24 * 60 * MINUTE_MS),
      },
    })
      .select('date timeSlot status holdExpiresAt customer.name')
      .lean(),
  ]);

  return [...modern, ...legacy]
    .filter((booking) => !isExpiredHold(booking, now))
    .map((booking) => {
      const interval = legacyInterval(booking, zone);
      return interval ? { ...interval, bookingId: booking._id, status: booking.status } : null;
    })
    .filter(Boolean);
};

const serializeSlot = (slot, zone, dayKey) => ({
  date: dayKey,
  start: slot.startAt.toISOString(),
  end: slot.endAt.toISOString(),
  localStart: slot.localStart,
  localEnd: slot.localEnd,    label: `${slot.localStart} – ${slot.localEnd}`,
    timezone: zone,
  });

/**
 * Classifies every grid start for one provider-local day.
 * `rejected` maps a slot start ISO to why it cannot be booked.
 */
export const computeDayAvailability = ({
  schedule,
  durationMinutes,
  dayKey,
  occupied = [],
  now = new Date(),
}) => {
  const zone = schedule.timezone;
  const todayKey = DateTime.fromJSDate(now, { zone }).toISODate();
  const lastDayKey = DateTime.fromISO(todayKey, { zone }).plus({ days: schedule.bookingWindowDays }).toISODate();
  const blocked = blockedDayKeys(schedule);
  const leadCutoff = now.getTime() + schedule.minimumLeadTimeMinutes * MINUTE_MS;
  const padded = occupied.map((interval) => padInterval(interval, schedule.bufferTime));

  const slots = [];
  const rejected = new Map();

  for (const candidate of buildDayCandidates({ schedule, durationMinutes, dayKey })) {
    const startMs = candidate.startAt.getTime();
    let reason = null;

    if (dayKey < todayKey || startMs < now.getTime()) reason = 'past';
    else if (dayKey > lastDayKey) reason = 'beyond_horizon';
    else if (blocked.has(dayKey)) reason = 'blocked';
    else if (startMs < leadCutoff) reason = 'lead_time';
    else if (padded.some((interval) => intervalsOverlap(startMs, candidate.endAt.getTime(), interval.start, interval.end))) {
      reason = 'taken';
    }

    if (reason) rejected.set(candidate.startAt.toISOString(), reason);
    else slots.push(candidate);
  }

  return { slots, rejected, dayKey };
};

const resolveProvider = async ({ provider, slug }) => {
  if (slug) {
    if (typeof slug !== 'string') return null;
    return User.findOne({ slug: slug.toLowerCase() }).select('_id slug businessName name paymentMethods bankAccount').lean();
  }
  if (provider && mongoose.Types.ObjectId.isValid(provider)) {
    return User.findById(provider).select('_id slug businessName name paymentMethods bankAccount').lean();
  }
  return null;
};

export const loadProviderSchedule = async (providerId) => {
  const schedule = await Schedule.findOne({ provider: providerId }).lean();
  return normalizeSchedule(schedule, providerId);
};

const loadService = async ({ providerId, serviceId }) => {
  if (!serviceId) {
    throw new AvailabilityError(400, 'SERVICE_REQUIRED', 'A service is required to check availability.');
  }
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AvailabilityError(400, 'INVALID_SERVICE_ID', 'The service id is not valid.');
  }
  const service = await Service.findOne({ _id: serviceId, provider: providerId })
    .select('_id name duration price isActive provider')
    .lean();
  if (!service) {
    throw new AvailabilityError(404, 'SERVICE_NOT_FOUND', 'Service not found for this provider.');
  }
  if (service.isActive === false) {
    throw new AvailabilityError(404, 'SERVICE_INACTIVE', 'This service is no longer bookable.');
  }
  if (!(Number(service.duration) > 0)) {
    throw new AvailabilityError(409, 'SERVICE_DURATION_INVALID', 'This service has an invalid duration. Please contact the provider.');
  }
  return service;
};

export const resolveAvailabilityContext = async ({ provider, slug, serviceId }) => {
  let providerUser = await resolveProvider({ provider, slug });

  // Backward compatibility: older API clients submit only a service id.
  if (!providerUser && !provider && !slug && serviceId) {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new AvailabilityError(400, 'INVALID_SERVICE_ID', 'The service id is not valid.');
    }
    const service = await Service.findById(serviceId).select('provider').lean();
    if (!service) {
      throw new AvailabilityError(404, 'SERVICE_NOT_FOUND', 'Service not found.');
    }
    providerUser = await User.findById(service.provider).select('_id slug businessName name paymentMethods bankAccount').lean();
  }

  if (!providerUser) {
    throw new AvailabilityError(404, 'PROVIDER_NOT_FOUND', 'Provider not found.');
  }
  const [schedule, service] = await Promise.all([
    loadProviderSchedule(providerUser._id),
    loadService({ providerId: providerUser._id, serviceId }),
  ]);
  return { provider: providerUser, schedule, service };
};

/**
 * Backward-compatible input: older clients send `date` + `timeSlot.startTime`
 * instead of a UTC `startAt`. Interpret that clock time in the provider zone.
 */
export const deriveStartAt = ({ date, startTime, timezone }) => {
  if (!date || !startTime) return null;
  const zone = resolveTimezone(timezone);
  const day = DateTime.fromJSDate(new Date(date), { zone });
  if (!day.isValid) return null;
  const parsed = parseLocalMinutes(startTime, day.toISODate(), zone);
  return parsed?.isValid ? parsed.toUTC().toJSDate() : null;
};

const timezoneLabel = (zone) => {
  const now = DateTime.now().setZone(zone);
  return `${zone} (${now.offsetNameShort || `UTC${now.toFormat('ZZ')}`})`;
};

const availabilityWindow = (schedule, now) => {
  const zone = schedule.timezone;
  const today = DateTime.fromJSDate(now, { zone }).startOf('day');
  const lastDay = today.plus({ days: schedule.bookingWindowDays });
  return { zone, today, lastDay };
};

/**
 * Availability for a provider/service, optionally for one provider-local date.
 * `days` always describes the full horizon so the storefront calendar is
 * server-driven; `slots` are for the requested date (defaults to first open day).
 */
export const getAvailability = async ({ provider, slug, serviceId, date, now = new Date() }) => {
  const context = await resolveAvailabilityContext({ provider, slug, serviceId });
  const { schedule, service } = context;
  const { zone, today, lastDay } = availabilityWindow(schedule, now);

  const from = new Date(today.toUTC().toJSDate().getTime() - 24 * 60 * MINUTE_MS);
  const occupied = await getOccupiedIntervals({
    providerId: context.provider._id,
    schedule,
    from,
    to: lastDay.endOf('day').toUTC().toJSDate(),
    now,
  });

  const encodedDays = [];
  for (let offset = 0; offset <= schedule.bookingWindowDays; offset += 1) {
    const day = today.plus({ days: offset });
    const dayKey = day.toISODate();
    const { slots } = computeDayAvailability({
      schedule,
      durationMinutes: Math.round(Number(service.duration) * 60),
      dayKey,
      occupied,
      now,
    });
    encodedDays.push({
      date: dayKey,
      available: slots.length > 0,
      slotCount: slots.length,
    });
  }

  let requestedKey = null;
  if (date) {
    const parsed = DateTime.fromISO(String(date), { zone, setZone: true });
    if (!parsed.isValid) {
      throw new AvailabilityError(400, 'INVALID_DATE', 'The requested date is not valid.');
    }
    requestedKey = parsed.toISODate();
  }

  const dayForSlots = requestedKey || encodedDays.find((day) => day.available)?.date || today.toISODate();
  const dayAvailability = computeDayAvailability({
    schedule,
    durationMinutes: Math.round(Number(service.duration) * 60),
    dayKey: dayForSlots,
    occupied,
    now,
  });

  const alternatives = [];
  for (const day of encodedDays) {
    if (alternatives.length >= 5) break;
    if (day.date < dayForSlots) continue;
    if (!day.available) continue;
    const candidateDay = computeDayAvailability({
      schedule,
      durationMinutes: Math.round(Number(service.duration) * 60),
      dayKey: day.date,
      occupied,
      now,
    });
    for (const slot of candidateDay.slots) {
      alternatives.push(serializeSlot(slot, zone, day.date));
      if (alternatives.length >= 5) break;
    }
  }

  return {
    provider: {
      _id: context.provider._id,
      slug: context.provider.slug,
      businessName: context.provider.businessName || context.provider.name,
      timezone: zone,
    },
    service: {
      _id: service._id,
      name: service.name,
      durationMinutes: Math.round(Number(service.duration) * 60),
      price: service.price,
    },
    timezone: zone,
    timezoneLabel: timezoneLabel(zone),
    horizonDays: schedule.bookingWindowDays,
    minimumLeadTimeMinutes: schedule.minimumLeadTimeMinutes,
    date: dayForSlots,
    days: encodedDays,
    slots: dayAvailability.slots.map((slot) => serializeSlot(slot, zone, dayAvailability.dayKey)),
    alternatives,
    hasAvailability: encodedDays.some((day) => day.available),
  };
};

/**
 * Validates a requested start instant against the server grid. Booking creation
 * must call this — the client's opinion of "available" is not trusted.
 */
export const validateRequestedStart = async ({ schedule, providerId, service, startAt, now = new Date() }) => {
  const zone = schedule.timezone;
  const start = DateTime.fromJSDate(new Date(startAt), { zone });
  if (!start.isValid) {
    throw new AvailabilityError(400, 'INVALID_START', 'The requested booking time is not valid.');
  }
  const dayKey = start.toISODate();
  const { today, lastDay } = availabilityWindow(schedule, now);

  if (start < today) {
    throw new AvailabilityError(400, 'SLOT_NOT_AVAILABLE', 'That time is in the past. Please choose a later slot.', { reason: 'past' });
  }
  if (dayKey > lastDay.toISODate()) {
    throw new AvailabilityError(400, 'SLOT_NOT_AVAILABLE', 'That date is outside the booking window.', { reason: 'beyond_horizon' });
  }

  const occupied = await getOccupiedIntervals({
    providerId,
    schedule,
    from: new Date(start.minus({ days: 1 }).toUTC().toJSDate()),
    to: new Date(start.plus({ days: 1 }).toUTC().toJSDate()),
    now,
  });

  const { slots, rejected } = computeDayAvailability({
    schedule,
    durationMinutes: Math.round(Number(service.duration) * 60),
    dayKey,
    occupied,
    now,
  });

  const requestedIso = start.toUTC().toJSDate().toISOString();
  const match = slots.find((slot) => slot.startAt.toISOString() === requestedIso);
  if (match) return match;

  const reason = rejected.get(requestedIso) || 'not_offered';
  const messages = {
    past: 'That time is in the past. Please choose a later slot.',
    beyond_horizon: 'That date is outside the booking window.',
    blocked: 'The provider is not available on that date.',
    lead_time: 'That time is inside the provider\'s minimum notice period.',
    taken: 'That slot was just taken. Please choose another time.',
    not_offered: 'That time is not one of the provider\'s available start times.',
  };
  throw new AvailabilityError(
    reason === 'taken' ? 409 : 400,
    reason === 'taken' ? 'SLOT_UNAVAILABLE' : 'SLOT_NOT_AVAILABLE',
    messages[reason] || messages.not_offered,
    { reason }
  );
};

const minuteUnits = (startAt, endAt) => {
  const startMinute = Math.floor(startAt.getTime() / MINUTE_MS);
  const endMinute = Math.ceil(endAt.getTime() / MINUTE_MS);
  if (endMinute <= startMinute) {
    throw new AvailabilityError(400, 'INVALID_DURATION', 'Booking end must be after its start.');
  }
  if (endMinute - startMinute > MAX_BOOKING_MINUTES) {
    throw new AvailabilityError(400, 'INVALID_DURATION', 'Bookings longer than 24 hours are not supported.');
  }
  return { startMinute, endMinute };
};

/**
 * Atomically claims every minute of [startAt, endAt) for a provider.
 * Returns false when any minute is already claimed (overlap or exact match).
 * Design: one claim document per occupied minute with a unique key, so
 * different-duration services that overlap always collide.
 */
export const claimSlot = async ({
  providerId,
  bookingId,
  startAt,
  endAt,
  expiresAt = null,
  status = 'held',
  attemptId,
}) => {
  const { startMinute, endMinute } = minuteUnits(startAt, endAt);
  const attempt = attemptId || `claim_${new mongoose.Types.ObjectId()}`;
  const docs = [];

  for (let unit = startMinute; unit < endMinute; unit += 1) {
    docs.push({
      provider: providerId,
      booking: bookingId,
      unit,
      unitKey: `${providerId.toString()}:${unit}`,
      startAt,
      endAt,
      expiresAt,
      status,
      attemptId: attempt,
    });
  }

  try {
    await SlotClaim.insertMany(docs, { ordered: true });
    return { ok: true, attemptId: attempt };
  } catch (error) {
    await SlotClaim.deleteMany({ attemptId: attempt }).catch(() => {});
    if (error?.code === 11000) return { ok: false, attemptId: attempt };
    throw error;
  }
};

/** Frees the calendar. Call on cancel, reject, or any terminal non-confirmed state. */
export const releaseSlot = async (bookingId, reason = 'released') => {
  const result = await SlotClaim.deleteMany({ booking: bookingId });
  if (result.deletedCount > 0) {
    console.log(`[availability] released ${result.deletedCount} claim(s) for booking ${bookingId} (${reason})`);
  }
  return result.deletedCount;
};

/** Confirmed bookings never expire; their claims become permanent. */
export const confirmSlot = async (bookingId) => {
  await SlotClaim.updateMany(
    { booking: bookingId },
    { $set: { status: 'confirmed', expiresAt: null } }
  );
};

/**
 * Lazy sweep: cancels unpaid pending bookings whose hold elapsed and frees their
 * claims. Confirmed bookings are never touched. Also clears orphan claims.
 */
/**
 * Scheduled sweep across all providers (see POST /api/availability/sweep).
 * Lazy per-provider sweeps still run on every booking attempt.
 */
export const sweepExpiredHolds = async ({ now = new Date() } = {}) => {
  const providerIds = await Booking.distinct('provider', {
    status: 'pending',
    holdExpiresAt: { $ne: null, $lte: now },
  });

  let released = 0;
  for (const providerId of providerIds) {
    released += await releaseExpiredHolds(providerId, { now });
  }

  await SlotClaim.deleteMany({ expiresAt: { $ne: null, $lte: now } });
  return { providers: providerIds.length, released };
};

export const releaseExpiredHolds = async (providerId, { now = new Date() } = {}) => {
  const expired = await Booking.find({
    provider: providerId,
    status: 'pending',
    holdExpiresAt: { $ne: null, $lte: now },
  })
    .select('_id')
    .lean();

  if (expired.length > 0) {
    const ids = expired.map((booking) => booking._id);
    await Booking.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { $set: { status: 'cancelled', paymentStatus: 'cancelled' } }
    );
    await SlotClaim.deleteMany({ booking: { $in: ids } });
  }

  await SlotClaim.deleteMany({
    provider: providerId,
    expiresAt: { $ne: null, $lte: now },
  });

  return expired.length;
};
