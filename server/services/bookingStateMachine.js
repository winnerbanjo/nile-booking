/**
 * One vocabulary and one transition table for the booking/payment lifecycle.
 *
 * The vocabulary is taken from the existing Mongoose enums — no new status
 * values are introduced. Every path that changes booking/payment state (manual
 * verification, provider approve/reject, admin queue, gateway callbacks,
 * cancellation, completion) must call `transition()`.
 */

export const BOOKING_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'rejected',
  'completed',
  'cancelled',
]);

export const PAYMENT_STATUSES = Object.freeze([
  'awaiting_payment',
  'awaiting_verification',
  'confirmed',
  'cancelled',
]);

export const BOOKING_EVENTS = Object.freeze({
  PAYMENT_CONFIRMED: 'payment_confirmed',
  GATEWAY_PAYMENT_SUCCEEDED: 'gateway_payment_succeeded',
  GATEWAY_PAYMENT_FAILED: 'gateway_payment_failed',
  PAYMENT_REJECTED: 'payment_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
});

const PENDING_PAYMENT_STATES = ['awaiting_payment', 'awaiting_verification'];

/**
 * `from` lists the only valid (status, paymentStatus) pairs.
 * `to` is the resulting pair, or a function of (booking, context).
 */
export const TRANSITIONS = Object.freeze({
  [BOOKING_EVENTS.PAYMENT_CONFIRMED]: {
    from: [{ status: 'pending', paymentStatus: PENDING_PAYMENT_STATES }],
    to: { status: 'confirmed', paymentStatus: 'confirmed' },
  },
  [BOOKING_EVENTS.GATEWAY_PAYMENT_SUCCEEDED]: {
    from: [{ status: 'pending', paymentStatus: PENDING_PAYMENT_STATES }],
    to: { status: 'confirmed', paymentStatus: 'confirmed' },
  },
  [BOOKING_EVENTS.GATEWAY_PAYMENT_FAILED]: {
    // Booking stays pending so the customer can retry; the transaction records
    // the failure. Kept in the table so handlers cannot invent another path.
    from: [{ status: 'pending', paymentStatus: ['awaiting_payment'] }],
    to: { status: 'pending', paymentStatus: 'awaiting_payment' },
  },
  [BOOKING_EVENTS.PAYMENT_REJECTED]: {
    from: [{ status: 'pending', paymentStatus: PENDING_PAYMENT_STATES }],
    to: { status: 'rejected', paymentStatus: 'cancelled' },
  },
  [BOOKING_EVENTS.BOOKING_CANCELLED]: {
    from: [
      { status: 'pending', paymentStatus: ['awaiting_payment', 'awaiting_verification', 'confirmed'] },
      { status: 'confirmed', paymentStatus: ['awaiting_payment', 'awaiting_verification', 'confirmed'] },
    ],
    to: { status: 'cancelled', paymentStatus: 'cancelled' },
  },
  [BOOKING_EVENTS.BOOKING_COMPLETED]: {
    from: [{ status: 'confirmed', paymentStatus: ['confirmed'] }],
    to: { status: 'completed', paymentStatus: 'confirmed' },
  },
});

export class BookingTransitionError extends Error {
  constructor(code, message, statusCode = 409, details = {}) {
    super(message);
    this.name = 'BookingTransitionError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const canTransition = (booking, event) => {
  const rule = TRANSITIONS[event];
  if (!rule || !booking) return false;
  return rule.from.some(
    (entry) => entry.status === booking.status && entry.paymentStatus.includes(booking.paymentStatus)
  );
};

/**
 * Validate and apply one event. Mutates `booking.status` / `booking.paymentStatus`.
 * Throws BookingTransitionError for an unknown event or an illegal state.
 */
export const transition = (booking, event, actor = {}) => {
  const rule = TRANSITIONS[event];
  if (!rule) {
    throw new BookingTransitionError(
      'UNKNOWN_EVENT',
      `Unknown booking event: ${event}`,
      400
    );
  }

  const allowed = rule.from.some(
    (entry) => entry.status === booking.status && entry.paymentStatus.includes(booking.paymentStatus)
  );

  if (!allowed) {
    throw new BookingTransitionError(
      'INVALID_BOOKING_TRANSITION',
      `Cannot apply "${event}" to a ${booking.status}/${booking.paymentStatus} booking.`,
      409,
      { event, status: booking.status, paymentStatus: booking.paymentStatus, actor: actor?.role || 'unknown' }
    );
  }

  const next = typeof rule.to === 'function' ? rule.to(booking, actor) : rule.to;
  const previous = { status: booking.status, paymentStatus: booking.paymentStatus };

  booking.status = next.status;
  booking.paymentStatus = next.paymentStatus;

  return { booking, previous, event, actor };
};
