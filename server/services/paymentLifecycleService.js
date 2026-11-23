import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import {
  BOOKING_EVENTS,
  BookingTransitionError,
  transition,
} from './bookingStateMachine.js';
import {
  sendBookingConfirmation,
  notifyBookingCancellation,
} from './notificationService.js';

/**
 * Payment lifecycle for bookings.
 *
 * - one state machine (`bookingStateMachine.js`) for every status change
 * - money truth: totalPrice / depositAmount / balanceDue / amountReceived
 * - manual verification requires evidence and an amount
 * - gateway handlers use the same transition, so transaction success can never
 *   leave a booking unconfirmed
 *
 * Transaction/booking writes use compensating rollback rather than a MongoDB
 * transaction: it works on standalone deployments as well as Atlas replica sets.
 */

export class PaymentLifecycleError extends Error {
  constructor(statusCode, code, message, details = {}) {
    super(message);
    this.name = 'PaymentLifecycleError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const getDepositPercent = () => {
  const parsed = Number(process.env.DEPOSIT_PERCENT);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return 50;
  return parsed;
};

export const totalPriceOf = (booking) =>
  Number(booking?.totalPrice) || Number(booking?.pricing?.totalAmount) || 0;

/**
 * Amounts persisted at booking creation.
 * `expectedPayment` is what this payment step should collect (deposit or full
 * price); `balanceDue` always reflects money not yet confirmed.
 */
export const computeBookingAmounts = ({ servicePrice, paymentType, depositPercent = getDepositPercent() }) => {
  const totalPrice = roundMoney(servicePrice);
  const depositAmount = paymentType === 'deposit' ? roundMoney((totalPrice * depositPercent) / 100) : 0;
  const expectedPayment = paymentType === 'deposit' ? depositAmount : totalPrice;
  return {
    totalPrice,
    depositAmount,
    expectedPayment,
    balanceDue: totalPrice,
    depositPercent,
  };
};

const findTransactionForBooking = (bookingId) =>
  Transaction.findOne({ booking: bookingId }).sort({ createdAt: 1 });

const requireProviderAccess = (booking, actor) => {
  if (!actor) {
    throw new PaymentLifecycleError(401, 'AUTH_REQUIRED', 'You must be signed in.');
  }
  if (actor.role === 'admin') return;
  const providerId = booking.provider?._id || booking.provider;
  const actorId = actor._id?._id || actor._id;
  if (String(providerId) !== String(actorId)) {
    throw new PaymentLifecycleError(403, 'FORBIDDEN', 'You are not authorized to change this booking.');
  }
};

const confirmationEmailPayload = (booking) => ({
  status: booking.confirmationEmail?.status || 'not_sent',
  sentAt: booking.confirmationEmail?.sentAt || null,
  error: booking.confirmationEmail?.error || null,
});

/**
 * Sends the final confirmation once and records the outcome. Email failures are
 * visible on the booking but never fail verification.
 */
const deliverConfirmation = async (booking, sendEmailFn) => {
  const emailClaim = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      'confirmationEmail.status': { $nin: ['pending', 'sent'] },
    },
    { $set: { 'confirmationEmail.status': 'pending', 'confirmationEmail.error': null } },
    { new: true }
  );

  if (!emailClaim) {
    const current = await Booking.findById(booking._id).lean();
    return confirmationEmailPayload(current || booking);
  }

  if (!booking.customer?.email) {
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { 'confirmationEmail.status': 'not_sent', 'confirmationEmail.error': 'Customer has no email address' } }
    );
    return { status: 'not_sent', error: 'Customer has no email address' };
  }

  let result;
  try {
    result = await sendEmailFn(booking._id);
  } catch (error) {
    result = { success: false, error: error.message };
  }

  const outcome = result?.success
    ? { status: 'sent', sentAt: new Date(), error: null }
    : { status: 'failed', sentAt: null, error: String(result?.error || 'Email delivery failed') };

  await Booking.updateOne(
    { _id: booking._id },
    {
      $set: {
        'confirmationEmail.status': outcome.status,
        'confirmationEmail.sentAt': outcome.sentAt,
        'confirmationEmail.error': outcome.error,
      },
    }
  );

  booking.confirmationEmail = outcome;
  return outcome;
};

const verifyEvidence = (booking, { cashAcknowledged }) => {
  if (booking.paymentMethod === 'pay_later') {
    if (cashAcknowledged !== true) {
      throw new PaymentLifecycleError(
        422,
        'CASH_ACKNOWLEDGEMENT_REQUIRED',
        'Confirm that cash was received before verifying this booking.'
      );
    }
    return;
  }

  if (!booking.receiptImageUrl) {
    throw new PaymentLifecycleError(
      422,
      'RECEIPT_REQUIRED',
      'A receipt is required before this payment can be verified.'
    );
  }
};

/**
 * Manual verification (provider or admin) for bank transfer or pay-in-person.
 * One transition moves the booking to confirmed/confirmed.
 */
export const verifyBookingPayment = async ({
  bookingId,
  transactionId,
  actor,
  amountReceived,
  overrideReason,
  cashAcknowledged,
  sendEmailFn = sendBookingConfirmation,
}) => {
  let booking;
  let transaction;

  if (transactionId) {
    transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new PaymentLifecycleError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found.');
    }
    booking = await Booking.findById(transaction.booking).populate('service provider');
  } else {
    booking = await Booking.findById(bookingId).populate('service provider');
    if (booking) transaction = await findTransactionForBooking(booking._id);
  }

  if (!booking) {
    throw new PaymentLifecycleError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }
  requireProviderAccess(booking, actor);

  // Double-click / retry: identical successful outcome, no second email.
  if (booking.status === 'confirmed' && booking.paymentStatus === 'confirmed') {
    if (transaction && transaction.status !== 'successful') {
      transaction.status = 'successful';
      transaction.verifiedAt = transaction.verifiedAt || new Date();
      transaction.paidAt = transaction.paidAt || new Date();
      transaction.amountReceived = transaction.amountReceived || booking.amountReceived || transaction.amount;
      transaction.verifiedBy = transaction.verifiedBy || actor._id;
      await transaction.save();
    }
    return {
      booking,
      transaction,
      alreadyVerified: true,
      email: confirmationEmailPayload(booking),
    };
  }

  if (!transaction) {
    throw new PaymentLifecycleError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found for this booking.');
  }

  verifyEvidence(booking, { cashAcknowledged });

  const expected = Number(transaction.amount);
  const received = Number(amountReceived);
  if (!Number.isFinite(received) || received <= 0) {
    throw new PaymentLifecycleError(422, 'AMOUNT_REQUIRED', 'Enter the amount received.');
  }

  const mismatch = Math.abs(received - expected) > 0.5;
  if (mismatch && !String(overrideReason || '').trim()) {
    throw new PaymentLifecycleError(
      422,
      'AMOUNT_MISMATCH',
      `Amount received (${received}) does not match the expected amount (${expected}). Provide a reason to record a partial payment.`,
      { expectedAmount: expected, amountReceived: received }
    );
  }

  try {
    transition(booking, BOOKING_EVENTS.PAYMENT_CONFIRMED, actor);
  } catch (error) {
    if (error instanceof BookingTransitionError) {
      throw new PaymentLifecycleError(error.statusCode, error.code, error.message, error.details);
    }
    throw error;
  }

  const previousTransaction = {
    status: transaction.status,
    amountReceived: transaction.amountReceived,
  };

  transaction.status = 'successful';
  transaction.verifiedAt = new Date();
  transaction.paidAt = new Date();
  transaction.amountReceived = roundMoney(received);
  transaction.verifiedBy = actor._id;
  transaction.paymentGateway = transaction.paymentGateway || (booking.paymentMethod === 'pay_later' ? 'pay_later' : 'bank_transfer');
  await transaction.save();

  const verifiedAt = new Date();
  const bookingUpdate = {
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    amountReceived: roundMoney(received),
    balanceDue: Math.max(0, roundMoney(totalPriceOf(booking) - received)),
    verifiedBy: actor._id,
    verifiedAt,
    verificationOverrideReason: mismatch ? String(overrideReason).trim() : null,
    holdExpiresAt: null,
  };
  if (booking.paymentMethod === 'pay_later' && cashAcknowledged === true) {
    bookingUpdate.cashAcknowledged = true;
    bookingUpdate.cashAcknowledgedAt = verifiedAt;
  }

  // Claim the pending -> confirmed transition atomically. A simultaneous
  // verifier loses this compare-and-set and returns the winning result.
  const claimedBooking = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: 'pending',
      paymentStatus: { $in: ['awaiting_payment', 'awaiting_verification'] },
    },
    { $set: bookingUpdate },
    { new: true, runValidators: true }
  );

  if (!claimedBooking) {
    const currentBooking = await Booking.findById(booking._id).populate('service provider');
    if (currentBooking?.status === 'confirmed' && currentBooking.paymentStatus === 'confirmed') {
      return {
        booking: currentBooking,
        transaction: await Transaction.findById(transaction._id),
        alreadyVerified: true,
        email: confirmationEmailPayload(currentBooking),
      };
    }

    await Transaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: previousTransaction.status,
          amountReceived: previousTransaction.amountReceived || 0,
          verifiedAt: null,
        },
      }
    ).catch(() => {});
    throw new PaymentLifecycleError(409, 'VERIFICATION_IN_PROGRESS', 'This payment is being verified. Please retry.');
  }

  booking = claimedBooking;
  try {
    // Run the model hook that synchronizes confirmed slot claims.
    await booking.save();
  } catch (error) {
    await Transaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: previousTransaction.status,
          amountReceived: previousTransaction.amountReceived || 0,
          verifiedAt: null,
        },
      }
    ).catch(() => {});
    await Booking.updateOne(
      { _id: booking._id, verifiedAt },
      {
        $set: {
          status: 'pending',
          paymentStatus: booking.receiptImageUrl ? 'awaiting_verification' : 'awaiting_payment',
          amountReceived: 0,
          balanceDue: totalPriceOf(booking),
          verifiedBy: null,
          verifiedAt: null,
          verificationOverrideReason: null,
          cashAcknowledged: false,
          cashAcknowledgedAt: null,
        },
      }
    ).catch(() => {});
    throw error;
  }

  const email = await deliverConfirmation(booking, sendEmailFn);

  return {
    booking,
    transaction,
    alreadyVerified: false,
    partial: mismatch,
    overrideReason: mismatch ? String(overrideReason).trim() : null,
    email,
  };
};

/** Reject a payment/booking; releases the slot through the model hook. */
export const rejectBooking = async ({ bookingId, actor, reason = '' }) => {
  const booking = await Booking.findById(bookingId).populate('service provider');
  if (!booking) throw new PaymentLifecycleError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  requireProviderAccess(booking, actor);

  try {
    transition(booking, BOOKING_EVENTS.PAYMENT_REJECTED, actor);
  } catch (error) {
    if (error instanceof BookingTransitionError) {
      throw new PaymentLifecycleError(error.statusCode, error.code, error.message, error.details);
    }
    throw error;
  }

  await booking.save();

  const transaction = await findTransactionForBooking(booking._id);
  if (transaction && transaction.status !== 'successful') {
    transaction.status = 'failed';
    transaction.failureReason = reason || 'Payment rejected by provider';
    await transaction.save().catch(() => {});
  }

  const notification = await notifyBookingCancellation(booking._id, {
    reason: reason || 'Your payment could not be verified.',
    outcome: 'rejected',
  }).catch((error) => ({ success: false, error: error.message }));

  return { booking, transaction, notification };
};

/** Cancel a pending/confirmed booking, release its slot, notify the customer. */
export const cancelBooking = async ({ bookingId, actor, reason = '' }) => {
  const booking = await Booking.findById(bookingId).populate('service provider');
  if (!booking) throw new PaymentLifecycleError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  requireProviderAccess(booking, actor);

  try {
    transition(booking, BOOKING_EVENTS.BOOKING_CANCELLED, actor);
  } catch (error) {
    if (error instanceof BookingTransitionError) {
      throw new PaymentLifecycleError(error.statusCode, error.code, error.message, error.details);
    }
    throw error;
  }

  await booking.save();

  const transaction = await findTransactionForBooking(booking._id);
  if (transaction && transaction.status !== 'successful') {
    transaction.status = 'cancelled';
    transaction.failureReason = reason || 'Booking cancelled';
    await transaction.save().catch(() => {});
  }

  const notification = await notifyBookingCancellation(booking._id, {
    reason: reason || 'Your booking has been cancelled.',
    outcome: 'cancelled',
  }).catch((error) => ({ success: false, error: error.message }));

  return { booking, transaction, notification };
};

export const completeBooking = async ({ bookingId, actor }) => {
  const booking = await Booking.findById(bookingId).populate('service provider');
  if (!booking) throw new PaymentLifecycleError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  requireProviderAccess(booking, actor);

  try {
    transition(booking, BOOKING_EVENTS.BOOKING_COMPLETED, actor);
  } catch (error) {
    if (error instanceof BookingTransitionError) {
      throw new PaymentLifecycleError(error.statusCode, error.code, error.message, error.details);
    }
    throw error;
  }

  await booking.save();
  return { booking };
};

const findTransactionByReference = async (reference) => {
  if (!reference) return null;
  return Transaction.findOne({
    $or: [{ transactionReference: reference }, { gatewayReference: reference }],
  });
};

/**
 * Shared gateway success handler. Idempotent: a duplicate callback returns the
 * same state and never sends a second confirmation email.
 */
export const applyGatewaySuccess = async ({
  reference,
  bookingNumber,
  gateway,
  amount,
  currency,
  metadata = {},
  sendEmailFn = sendBookingConfirmation,
}) => {
  let transaction = await findTransactionByReference(reference);
  let booking = transaction ? await Booking.findById(transaction.booking).populate('service provider') : null;

  if (!booking && bookingNumber) {
    booking = await Booking.findOne({ bookingNumber }).populate('service provider');
    if (booking && !transaction) transaction = await findTransactionForBooking(booking._id);
  }

  if (!booking) {
    throw new PaymentLifecycleError(404, 'BOOKING_NOT_FOUND', 'No booking matches this payment reference.');
  }

  if (transaction?.status === 'successful' && booking.paymentStatus === 'confirmed') {
    return { booking, transaction, alreadyProcessed: true, email: confirmationEmailPayload(booking) };
  }

  if (!transaction) {
    throw new PaymentLifecycleError(404, 'TRANSACTION_NOT_FOUND', 'No transaction matches this payment reference.');
  }

  const expected = Number(transaction.amount);
  const paid = Number(amount);
  if (!Number.isFinite(paid) || Math.abs(paid - expected) > 0.5 || (currency && currency !== transaction.currency)) {
    transaction.status = 'failed';
    transaction.failureReason = `Gateway amount/currency mismatch (expected ${expected} ${transaction.currency}, got ${amount} ${currency})`;
    await transaction.save();
    return { success: false, mismatch: true, booking, transaction };
  }

  // Recover from a crash where the transaction succeeded but the booking did not.
  const recovered = booking.status === 'confirmed' && booking.paymentStatus === 'confirmed';
  if (!recovered) {
    try {
      transition(booking, BOOKING_EVENTS.GATEWAY_PAYMENT_SUCCEEDED, { role: 'system', _id: null });
    } catch (error) {
      if (error instanceof BookingTransitionError) {
        throw new PaymentLifecycleError(error.statusCode, error.code, error.message, error.details);
      }
      throw error;
    }
  }

  transaction.status = 'successful';
  transaction.verifiedAt = transaction.verifiedAt || new Date();
  transaction.paidAt = transaction.paidAt || new Date();
  transaction.amountReceived = roundMoney(paid);
  transaction.gatewayReference = reference || transaction.gatewayReference;
  transaction.metadata = metadata;
  await transaction.save();

  if (!recovered) {
    booking.amountReceived = roundMoney(paid);
    booking.balanceDue = Math.max(0, roundMoney(totalPriceOf(booking) - paid));
    booking.paymentGateway = gateway;
    booking.paymentReference = reference;
    booking.verifiedAt = new Date();
    booking.holdExpiresAt = null;
    await booking.save();
  }

  const email = recovered
    ? confirmationEmailPayload(booking)
    : await deliverConfirmation(booking, sendEmailFn);

  return { success: true, booking, transaction, alreadyProcessed: recovered, email };
};

export const applyGatewayFailure = async ({ reference, reason = 'Gateway payment failed' }) => {
  const transaction = await findTransactionByReference(reference);
  if (!transaction) return { success: false, ignored: true };

  // A late failure callback must never downgrade a successful payment.
  if (transaction.status === 'successful') {
    return { success: true, ignored: true, transaction };
  }

  transaction.status = 'failed';
  transaction.failureReason = reason;
  await transaction.save();

  const booking = await Booking.findById(transaction.booking);
  if (booking && booking.status === 'pending' && booking.paymentStatus === 'awaiting_payment') {
    try {
      transition(booking, BOOKING_EVENTS.GATEWAY_PAYMENT_FAILED, { role: 'system', _id: null });
      await booking.save();
    } catch (error) {
      if (!(error instanceof BookingTransitionError)) throw error;
    }
  }
  return { success: true, transaction, booking };
};
