#!/usr/bin/env node
/**
 * DRY-RUN BY DEFAULT — NOT EXECUTED.
 *
 * Backfill `startAt` / `endAt` and minute claims for active future bookings that
 * predate the availability work. Legacy bookings still block new dates in the
 * read-side availability calculation, but they have no claims, so they are not
 * protected against a simultaneous write.
 *
 * Usage (review the dry run before using --apply):
 *   MONGODB_URI="..." node scripts/backfillBookingSlots.js
 *   MONGODB_URI="..." node scripts/backfillBookingSlots.js --apply
 *
 * Optional:
 *   --provider=<providerId>   limit to one provider
 *   --limit=<n>               inspect at most n bookings (default 500)
 *
 * This script never runs automatically and does not create indexes.
 */
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import Service from '../models/Service.js';
import SlotClaim from '../models/SlotClaim.js';
import { claimSlot, releaseSlot } from '../services/availabilityService.js';

const ACTIVE_STATUSES = ['pending', 'confirmed'];
const DEFAULT_LIMIT = 500;

const parseArgs = (argv) => {
  const options = { apply: false, limit: DEFAULT_LIMIT, provider: undefined };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg.startsWith('--limit=')) options.limit = Math.max(1, Number(arg.slice(8)) || DEFAULT_LIMIT);
    else if (arg.startsWith('--provider=')) options.provider = arg.slice(11);
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: MONGODB_URI="..." node scripts/backfillBookingSlots.js [--apply] [--provider=<id>] [--limit=<n>]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
};

const parseLocalTime = (dayKey, time, zone) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = DateTime.fromFormat(`${dayKey} ${time}`, 'yyyy-MM-dd HH:mm', { zone });
  return parsed.isValid ? parsed : null;
};

/**
 * Mirrors the legacy read-side interpretation: `date` identifies the
 * provider-local day, `timeSlot` carries the wall-clock time.
 */
const deriveLegacyInterval = ({ booking, zone, durationMinutes }) => {
  if (!booking.date) return { error: 'missing date' };
  const day = DateTime.fromJSDate(new Date(booking.date), { zone });
  if (!day.isValid) return { error: 'invalid date' };
  const dayKey = day.toISODate();
  const start = parseLocalTime(dayKey, booking.timeSlot?.startTime, zone);
  if (!start) return { error: 'missing or invalid timeSlot.startTime' };

  let end = durationMinutes > 0
    ? start.plus({ minutes: durationMinutes })
    : parseLocalTime(dayKey, booking.timeSlot?.endTime, zone);
  if (!end || end <= start) return { error: 'missing or invalid end time' };

  return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate(), dayKey };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const connect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Set it in the shell; do not commit it.');
  await mongoose.connect(uri);
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  await connect();

  const query = {
    status: { $in: ACTIVE_STATUSES },
    ...(options.provider ? { provider: options.provider } : {}),
    date: { $gte: new Date() },
    $or: [{ startAt: null }, { endAt: null }],
  };

  const candidates = await Booking.find(query)
    .select('provider service date timeSlot startAt endAt status bookingNumber')
    .sort({ date: 1 })
    .limit(options.limit)
    .lean();

  const providerIds = [...new Set(candidates.map((booking) => String(booking.provider)))];
  const schedules = await Schedule.find({ provider: { $in: providerIds } }).lean();
  const scheduleByProvider = new Map(schedules.map((schedule) => [String(schedule.provider), schedule]));

  const serviceIds = [...new Set(candidates.map((booking) => String(booking.service)))];
  const services = await Service.find({ _id: { $in: serviceIds } }).select('duration').lean();
  const durationByService = new Map(
    services.map((service) => [String(service._id), Math.round(Number(service.duration) * 60)])
  );

  const report = {
    mode: options.apply ? 'APPLY' : 'DRY RUN',
    inspected: candidates.length,
    skipped: [],
    planned: [],
    overlaps: [],
    applied: [],
    failed: [],
  };

  const plannedByProvider = new Map();

  for (const booking of candidates) {
    const providerId = String(booking.provider);
    const schedule = scheduleByProvider.get(providerId);
    const zone = schedule?.timezone || 'UTC';
    const durationMinutes = durationByService.get(String(booking.service)) || 0;
    const derived = deriveLegacyInterval({ booking, zone, durationMinutes });

    if (derived.error) {
      report.skipped.push({ bookingNumber: booking.bookingNumber, reason: derived.error });
      continue;
    }

    const existing = await Booking.find({
      _id: { $ne: booking._id },
      provider: booking.provider,
      status: { $in: ACTIVE_STATUSES },
      startAt: { $ne: null, $lt: derived.end },
      endAt: { $gt: derived.start },
    })
      .select('bookingNumber startAt endAt')
      .lean();

    const plannedForProvider = plannedByProvider.get(providerId) || [];
    const plannedOverlaps = plannedForProvider.filter((entry) =>
      overlaps(derived.start.getTime(), derived.end.getTime(), entry.start, entry.end)
    );

    const conflicts = [
      ...existing.map((other) => ({
        bookingNumber: other.bookingNumber,
        startAt: other.startAt,
        endAt: other.endAt,
      })),
      ...plannedOverlaps.map((other) => ({
        bookingNumber: other.bookingNumber,
        startAt: other.start,
        endAt: other.end,
      })),
    ];

    const plan = {
      bookingNumber: booking.bookingNumber,
      provider: providerId,
      startAt: derived.start,
      endAt: derived.end,
      timezone: zone,
      conflicts,
    };
    report.planned.push(plan);
    if (conflicts.length > 0) report.overlaps.push(plan);
    plannedForProvider.push({ bookingNumber: booking.bookingNumber, start: derived.start.getTime(), end: derived.end.getTime() });
    plannedByProvider.set(providerId, plannedForProvider);

    if (!options.apply) continue;

    const claimCount = await SlotClaim.countDocuments({ booking: booking._id });
    if (claimCount > 0) {
      report.skipped.push({ bookingNumber: booking.bookingNumber, reason: `already has ${claimCount} claim(s)` });
      continue;
    }

    const claim = await claimSlot({
      providerId: booking.provider,
      bookingId: booking._id,
      startAt: derived.start,
      endAt: derived.end,
      expiresAt: booking.status === 'confirmed' ? null : undefined,
      status: booking.status === 'confirmed' ? 'confirmed' : 'held',
    }).catch((error) => ({ ok: false, error: error.message }));

    if (!claim.ok) {
      report.failed.push({ bookingNumber: booking.bookingNumber, reason: claim.error || 'claim collision' });
      continue;
    }

    const updated = await Booking.updateOne(
      { _id: booking._id, $or: [{ startAt: null }, { endAt: null }] },
      { $set: { startAt: derived.start, endAt: derived.end } }
    ).catch((error) => ({ modifiedCount: 0, error: error.message }));

    if (!updated.modifiedCount) {
      await releaseSlot(booking._id, 'backfill-rollback');
      report.failed.push({ bookingNumber: booking.bookingNumber, reason: updated.error || 'booking changed during backfill' });
      continue;
    }

    report.applied.push({ bookingNumber: booking.bookingNumber, startAt: derived.start, endAt: derived.end });
  }

  console.log(JSON.stringify(report, null, 2));
  if (!options.apply) {
    console.log('\nDRY RUN ONLY. Re-run with --apply after reviewing overlaps and skipped bookings.');
  }
};

run()
  .catch((error) => {
    console.error('Backfill aborted:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
