import axios from 'axios';
import { randomBytes } from 'node:crypto';
import { DateTime } from 'luxon';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { logEvent } from '../utils/logger.js';

const portalBaseUrl = () =>
  (process.env.CLIENT_URL || process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://nilebooking.co').replace(/\/$/, '');

export const bookingPortalUrl = (token) => `${portalBaseUrl()}/bookings/${token}`;

export const ensurePublicToken = async (booking) => {
  if (!booking) return null;
  if (booking.publicToken) return booking.publicToken;

  const token = randomBytes(32).toString('hex');
  const result = await Booking.updateOne(
    {
      _id: booking._id,
      $or: [
        { publicToken: { $exists: false } },
        { publicToken: null },
        { publicToken: '' },
      ],
    },
    { $set: { publicToken: token } }
  );

  if (!result.modifiedCount) {
    const current = await Booking.findById(booking._id).select('+publicToken').lean();
    if (!current?.publicToken) {
      throw new Error('Could not assign a public booking token.');
    }
    booking.publicToken = current.publicToken;
    return current.publicToken;
  }

  booking.publicToken = token;
  return token;
};

const NOTIFICATION_KEYS = new Set([
  'bookingReceivedCustomer',
  'bookingReceivedProvider',
  'cancellationCustomer',
  'cancellationProvider',
]);

export const recordNotificationState = async (bookingId, key, patch = {}) => {
  if (!NOTIFICATION_KEYS.has(key)) throw new Error(`Unknown notification key: ${key}`);
  const allowed = {};
  for (const field of ['status', 'attempts', 'lastAttemptAt', 'sentAt', 'error']) {
    if (patch[field] !== undefined) allowed[`notifications.${key}.${field}`] = patch[field];
  }
  if (Object.keys(allowed).length > 0) {
    await Booking.updateOne({ _id: bookingId }, { $set: allowed });
  }
};

export const beginNotificationAttempt = async (bookingId, key) => {
  await recordNotificationState(bookingId, key, {
    status: 'pending',
    lastAttemptAt: new Date(),
    error: null,
  });
  await Booking.updateOne({ _id: bookingId }, { $inc: { [`notifications.${key}.attempts`]: 1 } });
};

/**
 * Send Email via Mailtrap Official HTTP API
 * Endpoint: https://send.api.mailtrap.io/api/send
 * Header: Authorization: Bearer <MAILTRAP_TOKEN>
 */
export const sendMailtrapApiEmail = async ({ toEmail, toName, subject, htmlContent, category = 'Integration Test' }) => {
  const token = process.env.MAILTRAP_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MAILTRAP_TOKEN is required in production.');
    }
    console.log(`[MAILTRAP MOCK EMAIL] To: ${toEmail} | Subject: ${subject}`);
    return { success: true, mock: true };
  }

  try {
    const payload = {
      from: {
        email: process.env.MAILTRAP_FROM_EMAIL || 'hello@nile.ng',
        name: process.env.MAILTRAP_FROM_NAME || 'Nile Booking',
      },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      html: htmlContent,
      category,
    };

    const response = await axios.post('https://send.api.mailtrap.io/api/send', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: Number(process.env.MAILTRAP_TIMEOUT_MS) || 10000,
    });

    const maskedEmail = toEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
    console.log(JSON.stringify({
      event: 'email_delivery',
      type: category,
      email: maskedEmail,
      provider: 'mailtrap_api',
      status: 'success',
      messageId: response.data?.message_ids?.[0] || 'unknown',
      error: null
    }));

    return { success: true, data: response.data, messageId: response.data?.message_ids?.[0] };
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const maskedEmail = toEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
    
    console.error(JSON.stringify({
      event: 'email_delivery',
      type: category,
      email: maskedEmail,
      provider: 'mailtrap_api',
      status: 'failed',
      messageId: null,
      error: errorMsg
    }));
    
    return { success: false, error: errorMsg };
  }
};

/**
 * Send WhatsApp Message via Twilio WhatsApp API
 */
export const sendTwilioWhatsApp = async (toPhone, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+15559425808';

  if (!accountSid || !authToken) {
    console.log(`[TWILIO WHATSAPP MOCK] To: ${toPhone} | Message: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const formattedTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone.replace(/[^0-9+]/g, '')}`;
    const params = new URLSearchParams();
    params.append('From', fromWhatsApp);
    params.append('To', formattedTo);
    params.append('Body', message);

    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log(`✅ Twilio WhatsApp Sent to ${formattedTo} | SID: ${response.data.sid}`);
    return { success: true, sid: response.data.sid };
  } catch (error) {
    console.error('❌ Twilio WhatsApp error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Generate WhatsApp booking link with rich preview
export const generateWhatsAppLink = (booking, provider) => {
  const receiptUrl = booking.publicToken
    ? bookingPortalUrl(booking.publicToken)
    : (process.env.CLIENT_URL || 'http://localhost:3000');
  const message = encodeURIComponent(
    `Hello ${booking.customer.name}! Your session for ${booking.service.name} with ${provider.businessName || provider.name} is confirmed for ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.timeSlot.startTime} | View your receipt: ${receiptUrl}`
  );
  const providerPhone = provider.phone || booking.customer.phone;
  return `https://wa.me/${providerPhone.replace(/[^0-9]/g, '')}?text=${message}`;
};

export const sendWhatsAppNotification = async (booking, type = 'booking_confirmed', options = {}) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .select('+publicToken')
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone');
    
    if (!bookingPopulated) return { success: false, error: 'Booking not found' };

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    const token = await ensurePublicToken(bookingPopulated);
    const receiptUrl = bookingPortalUrl(token);
    const bookingDate = new Date(bookingPopulated.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = bookingPopulated.timeSlot.startTime;

    let message = `✅ ${provider.businessName || provider.name} | Booking Confirmed\n\n` +
      `Hello ${customer.name}!\n\n` +
      `Your session for "${service.name}" is confirmed for ${formattedDate} at ${formattedTime}.\n\n` +
      `Booking #${bookingPopulated.bookingNumber}\n` +
      `View receipt: ${receiptUrl}\n\n` +
      `Powered by Nile Booking`;

    const recipient = customer.phone;
    return await sendTwilioWhatsApp(recipient, message);
  } catch (error) {
    console.error('❌ WhatsApp notification error:', error);
    return { success: false, error: error.message };
  }
};

const getNileLogoSVG = () => `
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
    <path d="M8 8 C12 12, 20 20, 24 24 C28 28, 36 36, 40 40 M8 8 L8 40 M40 8 L40 40" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const formatMoney = (amount, currency = 'NGN') => {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
};

/**
 * Final customer confirmation, sent once after payment verification.
 * Date/time are rendered in the provider's timezone, with the zone labelled.
 */
export const sendBookingConfirmation = async (booking) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .select('+publicToken')
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone email');

    if (!bookingPopulated) return { success: false, error: 'Booking not found' };
    if (!bookingPopulated.customer?.email) {
      return { success: false, error: 'Customer has no email address' };
    }

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    const schedule = await Schedule.findOne({ provider: provider?._id || bookingPopulated.provider }).lean();
    const timezone = schedule?.timezone || 'UTC';
    const start = bookingPopulated.startAt
      ? DateTime.fromJSDate(new Date(bookingPopulated.startAt), { zone: timezone })
      : DateTime.fromJSDate(new Date(bookingPopulated.date), { zone: timezone });
    const formattedDate = start.toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = `${bookingPopulated.timeSlot.startTime}–${bookingPopulated.timeSlot.endTime} (${timezone})`;
    const token = await ensurePublicToken(bookingPopulated);
    const receiptUrl = bookingPortalUrl(token);
    const providerName = provider?.businessName || provider?.name || 'your provider';
    const providerContact = provider?.email || provider?.phone || '';
    const currency = bookingPopulated.pricing?.currency || 'NGN';
    const amountPaid = bookingPopulated.amountReceived || bookingPopulated.pricing?.totalAmount || 0;
    const balanceDue = bookingPopulated.balanceDue || 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; padding: 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #09090b;">Booking Confirmed!</h2>
          <p>Hello ${escapeHtml(customer.name)}, your payment for <strong>${escapeHtml(service?.name || 'your appointment')}</strong> with ${escapeHtml(providerName)} has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#71717a;">Reference</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(bookingPopulated.bookingNumber)}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Service</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(service?.name || 'Appointment')}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Date</td><td style="padding:6px 0;font-weight:600;">${formattedDate}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Time</td><td style="padding:6px 0;font-weight:600;">${formattedTime}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Amount paid</td><td style="padding:6px 0;font-weight:600;">${formatMoney(amountPaid, currency)}</td></tr>
            ${balanceDue > 0 ? `<tr><td style="padding:6px 0;color:#71717a;">Balance due</td><td style="padding:6px 0;font-weight:600;">${formatMoney(balanceDue, currency)}</td></tr>` : ''}
          </table>
          ${providerContact ? `<p style="font-size:13px;color:#3f3f46;">Questions? Contact ${escapeHtml(providerName)}: ${escapeHtml(providerContact)}</p>` : ''}
          <a href="${receiptUrl}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Receipt</a>
        </div>
      </body>
      </html>
    `;

    return await sendMailtrapApiEmail({
      toEmail: customer.email,
      toName: customer.name,
      subject: `Booking Confirmed | ${service?.name || 'Appointment'} with ${providerName}`,
      htmlContent,
      category: 'Booking Confirmation',
    });
  } catch (error) {
    console.error('❌ sendBookingConfirmation error:', error);
    return { success: false, error: error.message };
  }
};

export const sendEmailNotification = async (booking, type = 'booking_confirmed') => {
  return await sendBookingConfirmation(booking);
};

export const notifyPaymentConfirmation = async (bookingId) => {
  await sendWhatsAppNotification(bookingId, 'booking_confirmed');
  await sendBookingConfirmation(bookingId);
  return { success: true };
};

export const notifyBookingCancellation = async (bookingId, { reason = '', outcome = 'cancelled' } = {}) => {
  try {
    const booking = await Booking.findById(bookingId)
      .select('+publicToken')
      .populate('service', 'name')
      .populate('provider', 'name businessName phone email');

    if (!booking) return { success: false, error: 'Booking not found' };
    if (!booking.customer?.email) {
      await recordNotificationState(booking._id, 'cancellationCustomer', {
        status: 'skipped',
        lastAttemptAt: new Date(),
        error: 'Customer has no email address',
      });
      return { success: false, skipped: true, error: 'Customer has no email address' };
    }

    await beginNotificationAttempt(booking._id, 'cancellationCustomer');
    const token = await ensurePublicToken(booking);
    const portalUrl = bookingPortalUrl(token);
    const providerName = booking.provider?.businessName || booking.provider?.name || 'your provider';
    const providerContact = booking.provider?.email || booking.provider?.phone || '';
    const heading = outcome === 'rejected' ? 'Payment Not Accepted' : 'Booking Cancelled';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; padding: 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #09090b;">${heading}</h2>
          <p>Hello ${escapeHtml(booking.customer.name)}, your booking <strong>${escapeHtml(booking.bookingNumber)}</strong> for ${escapeHtml(booking.service?.name || 'your appointment')} with ${escapeHtml(providerName)} is not going ahead.</p>
          ${reason ? `<p style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;">${escapeHtml(reason)}</p>` : ''}
          <p>The time has been released. You can book another slot on the provider's page.</p>
          ${providerContact ? `<p style="font-size:13px;color:#3f3f46;">Contact ${escapeHtml(providerName)}: ${escapeHtml(providerContact)}</p>` : ''}
          <p><a href="${portalUrl}">View booking</a></p>
        </div>
      </body>
      </html>
    `;

    const result = await sendMailtrapApiEmail({
      toEmail: booking.customer.email,
      toName: booking.customer.name,
      subject: `${heading} | ${booking.bookingNumber}`,
      htmlContent,
      category: 'Booking Cancellation',
    });

    await recordNotificationState(booking._id, 'cancellationCustomer', result?.success
      ? { status: 'sent', sentAt: new Date(), error: null }
      : { status: 'failed', error: String(result?.error || 'Email delivery failed') });

    return result;
  } catch (error) {
    console.error('❌ notifyBookingCancellation error:', error);
    return { success: false, error: error.message };
  }
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const bookingContext = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .select('+publicToken')
    .populate('service', 'name description price duration')
    .populate('provider', 'name businessName phone email');

  if (!booking) return null;

  const schedule = await Schedule.findOne({ provider: booking.provider?._id || booking.provider }).lean();
  const timezone = schedule?.timezone || 'UTC';
  const start = booking.startAt
    ? DateTime.fromJSDate(new Date(booking.startAt), { zone: timezone })
    : DateTime.fromJSDate(new Date(booking.date), { zone: timezone });
  const token = await ensurePublicToken(booking);

  return {
    booking,
    schedule,
    timezone,
    start,
    token,
    portalUrl: bookingPortalUrl(token),
    providerName: booking.provider?.businessName || booking.provider?.name || 'your provider',
  };
};

const deliverBookingReceived = async (bookingId, audience, { correlationId } = {}) => {
  const context = await bookingContext(bookingId);
  if (!context) return { success: false, error: 'Booking not found' };

  const { booking, start, timezone, providerName, portalUrl } = context;
  const key = audience === 'provider' ? 'bookingReceivedProvider' : 'bookingReceivedCustomer';
  const recipient = audience === 'provider' ? booking.provider?.email : booking.customer?.email;

  if (!recipient) {
    await recordNotificationState(booking._id, key, {
      status: 'skipped',
      lastAttemptAt: new Date(),
      error: audience === 'provider' ? 'Provider has no email address' : 'Customer has no email address',
    });
    return { success: false, skipped: true, error: 'No email address' };
  }

  await beginNotificationAttempt(booking._id, key);

  const subject =
    audience === 'provider'
      ? `New Booking - ${booking.service?.name || 'Appointment'} from ${booking.customer?.name || 'Customer'}`
      : `Booking Received - ${booking.service?.name || 'Appointment'} | Nile Booking`;
  const heading = audience === 'provider' ? 'New Booking' : 'Booking Received';
  const intro =
    audience === 'provider'
      ? `Hi ${escapeHtml(providerName)}, you have a new booking.`
      : `Hi ${escapeHtml(booking.customer?.name)}, your booking has been received and is awaiting confirmation.`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
      <h2 style="margin:0 0 8px;">${heading}</h2>
      <p style="color:#52525b;">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
        <tr><td style="padding:7px 0;color:#71717a;">Reference</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(booking.bookingNumber)}</td></tr>
        <tr><td style="padding:7px 0;color:#71717a;">Service</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(booking.service?.name || 'Appointment')}</td></tr>
        <tr><td style="padding:7px 0;color:#71717a;">Date</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(start.toLocaleString({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}</td></tr>
        <tr><td style="padding:7px 0;color:#71717a;">Time</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(booking.timeSlot?.startTime)}-${escapeHtml(booking.timeSlot?.endTime)} (${escapeHtml(timezone)})</td></tr>
        <tr><td style="padding:7px 0;color:#71717a;">Amount</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(formatMoney(booking.pricing?.totalAmount || booking.totalPrice, booking.pricing?.currency || 'NGN'))}</td></tr>
      </table>
      <p style="font-size:13px;color:#52525b;">Open your booking page to see payment instructions, upload a receipt later, or cancel:</p>
      <p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;">View Booking</a></p>
      <p style="font-size:12px;color:#a1a1aa;">Booking ${escapeHtml(booking.bookingNumber)}</p>
    </div>
  `;

  let result;
  try {
    result = await sendMailtrapApiEmail({
      toEmail: recipient,
      toName: audience === 'provider' ? providerName : booking.customer?.name,
      subject,
      htmlContent,
      category: audience === 'provider' ? 'Provider New Booking' : 'Booking Received',
    });
  } catch (error) {
    result = { success: false, error: error.message };
  }

  await recordNotificationState(booking._id, key, result?.success
    ? { status: 'sent', sentAt: new Date(), error: null }
    : { status: 'failed', error: String(result?.error || 'Email delivery failed') });

  logEvent('booking_notification', {
    correlationId,
    bookingId: String(booking._id),
    audience,
    status: result?.success ? 'sent' : 'failed',
  });

  return result;
};

export const sendBookingReceivedEmails = async (bookingId, options = {}) => {
  const [customer, provider] = await Promise.all([
    deliverBookingReceived(bookingId, 'customer', options),
    deliverBookingReceived(bookingId, 'provider', options),
  ]);
  return { customer, provider };
};

export const notifyProviderCancellation = async (bookingId, { reason = '' } = {}) => {
  const context = await bookingContext(bookingId);
  if (!context) return { success: false, error: 'Booking not found' };

  const { booking, start, timezone, portalUrl } = context;
  const providerEmail = booking.provider?.email;
  if (!providerEmail) {
    await recordNotificationState(booking._id, 'cancellationProvider', {
      status: 'skipped',
      lastAttemptAt: new Date(),
      error: 'Provider has no email address',
    });
    return { success: false, skipped: true, error: 'Provider has no email address' };
  }

  await beginNotificationAttempt(booking._id, 'cancellationProvider');
  const result = await sendMailtrapApiEmail({
    toEmail: providerEmail,
    toName: booking.provider?.businessName || booking.provider?.name,
    subject: `Booking Cancelled - ${booking.bookingNumber}`,
    category: 'Provider Booking Cancelled',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
        <h2 style="margin:0 0 8px;">Booking Cancelled</h2>
        <p><strong>${escapeHtml(booking.customer?.name || 'A customer')}</strong> cancelled ${escapeHtml(booking.service?.name || 'an appointment')} on ${escapeHtml(start.toLocaleString(DateTime.DATE_FULL))} at ${escapeHtml(booking.timeSlot?.startTime)} (${escapeHtml(timezone)}).</p>
        ${reason ? `<p style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">${escapeHtml(reason)}</p>` : ''}
        <p><a href="${escapeHtml(portalUrl)}">View booking</a></p>
      </div>
    `,
  });

  await recordNotificationState(booking._id, 'cancellationProvider', result?.success
    ? { status: 'sent', sentAt: new Date(), error: null }
    : { status: 'failed', error: String(result?.error || 'Email delivery failed') });

  return result;
};

const reminderStatePath = (kind) => `reminders.${kind}`;

const claimReminder = async (bookingId, kind, now) => {
  const path = reminderStatePath(kind);
  return Booking.findOneAndUpdate(
    {
      _id: bookingId,
      [`${path}.sentAt`]: null,
      $or: [
        { [`${path}.leaseUntil`]: null },
        { [`${path}.leaseUntil`]: { $lte: now } },
        { [`${path}.leaseUntil`]: { $exists: false } },
      ],
    },
    {
      $set: {
        [`${path}.status`]: 'sending',
        [`${path}.leaseUntil`]: new Date(now.getTime() + 5 * 60 * 1000),
        [`${path}.lastAttemptAt`]: now,
        [`${path}.error`]: null,
      },
      $inc: { [`${path}.attempts`]: 1 },
    },
    { new: true }
  ).select('+publicToken');
};

const finishReminder = async (bookingId, kind, result) => {
  const path = reminderStatePath(kind);
  await Booking.updateOne(
    { _id: bookingId },
    {
      $set: result?.success
        ? {
            [`${path}.status`]: 'sent',
            [`${path}.sentAt`]: new Date(),
            [`${path}.leaseUntil`]: null,
            [`${path}.error`]: null,
          }
        : {
            [`${path}.status`]: result?.skipped ? 'skipped' : 'failed',
            [`${path}.leaseUntil`]: null,
            [`${path}.error`]: String(result?.error || 'Reminder delivery failed'),
          },
    }
  );
};

const sendReminderEmail = async (booking, kind, context) => {
  if (!booking.customer?.email) {
    return { success: false, skipped: true, error: 'Customer has no email address' };
  }

  const { start, timezone, providerName, portalUrl } = context;
  const isHold = kind === 'unpaidHold';
  const subject = isHold
    ? `Payment reminder - ${booking.bookingNumber}`
    : `Appointment reminder - ${booking.bookingNumber}`;
  const intro = isHold
    ? `Your slot is still held, but payment has not been received yet. Upload your transfer receipt or cancel from your booking page.`
    : `This is a reminder for your upcoming appointment with ${providerName}.`;

  try {
    return await sendMailtrapApiEmail({
      toEmail: booking.customer.email,
      toName: booking.customer.name,
      subject,
      category: isHold ? 'Unpaid Hold Reminder' : 'Appointment Reminder',
      htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
        <h2 style="margin:0 0 8px;">${isHold ? 'Complete your booking' : 'Appointment Reminder'}</h2>
        <p>${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
          <tr><td style="padding:7px 0;color:#71717a;">Reference</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(booking.bookingNumber)}</td></tr>
          <tr><td style="padding:7px 0;color:#71717a;">Service</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(booking.service?.name || 'Appointment')}</td></tr>
          <tr><td style="padding:7px 0;color:#71717a;">When</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(start.toLocaleString({ weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} (${escapeHtml(timezone)})</td></tr>
          ${isHold && booking.holdExpiresAt ? `<tr><td style="padding:7px 0;color:#71717a;">Hold expires</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(DateTime.fromJSDate(new Date(booking.holdExpiresAt), { zone: timezone }).toLocaleString(DateTime.DATETIME_MED))}</td></tr>` : ''}
        </table>
          <p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;">Open Booking</a></p>
        </div>
      `,
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Idempotent reminder sweep. A booking is atomically leased before sending;
 * sentAt is the durable once-only guard. Delivery failures are retried by later
 * cron runs (at-least-once in the tiny crash window between send and mark).
 */
export const runReminders = async ({ now = new Date() } = {}) => {
  const holdLeadMinutes = Number(process.env.HOLD_REMINDER_LEAD_MINUTES) || 15;
  const appointmentLeadMinutes = Number(process.env.APPOINTMENT_REMINDER_LEAD_MINUTES) || 24 * 60;

  const unpaidCandidates = await Booking.find({
    status: 'pending',
    paymentStatus: 'awaiting_payment',
    paymentMethod: 'bank_transfer',
    holdExpiresAt: { $gt: now, $lte: new Date(now.getTime() + holdLeadMinutes * 60 * 1000) },
    'reminders.unpaidHold.sentAt': null,
    'reminders.unpaidHold.status': { $nin: ['sending', 'sent', 'skipped'] },
  }).limit(100).select('_id');

  const appointmentCandidates = await Booking.find({
    status: 'confirmed',
    startAt: { $gt: now, $lte: new Date(now.getTime() + appointmentLeadMinutes * 60 * 1000) },
    'reminders.appointment.sentAt': null,
    'reminders.appointment.status': { $nin: ['sending', 'sent', 'skipped'] },
  }).limit(100).select('_id');

  const result = {
    unpaidHoldSent: 0,
    unpaidHoldFailed: 0,
    appointmentSent: 0,
    appointmentFailed: 0,
  };

  for (const candidate of unpaidCandidates) {
    const claimed = await claimReminder(candidate._id, 'unpaidHold', now);
    if (!claimed) continue;
    const context = await bookingContext(claimed._id);
    const delivery = context
      ? await sendReminderEmail(claimed, 'unpaidHold', context)
      : { success: false, error: 'Booking not found' };
    await finishReminder(claimed._id, 'unpaidHold', delivery);
    if (delivery.success) result.unpaidHoldSent += 1;
    else result.unpaidHoldFailed += 1;
  }

  for (const candidate of appointmentCandidates) {
    const claimed = await claimReminder(candidate._id, 'appointment', now);
    if (!claimed) continue;
    const context = await bookingContext(claimed._id);
    const delivery = context
      ? await sendReminderEmail(claimed, 'appointment', context)
      : { success: false, error: 'Booking not found' };
    await finishReminder(claimed._id, 'appointment', delivery);
    if (delivery.success) result.appointmentSent += 1;
    else result.appointmentFailed += 1;
  }

  return result;
};

/** Backward-compatible name used by the job and notification controller. */
export const scheduleReminders = runReminders;

export const retryFailedNotifications = async ({ limit = 20 } = {}) => {
  const failed = await Booking.find({
    $or: [
      { 'notifications.bookingReceivedCustomer.status': 'failed' },
      { 'notifications.bookingReceivedProvider.status': 'failed' },
      { 'confirmationEmail.status': 'failed' },
      { 'notifications.cancellationCustomer.status': 'failed' },
      { 'notifications.cancellationProvider.status': 'failed' },
    ],
  }).limit(limit).select('+publicToken');

  const result = { attempted: 0, sent: 0, failed: 0 };

  for (const booking of failed) {
    if (booking.notifications?.bookingReceivedCustomer?.status === 'failed') {
      result.attempted += 1;
      const delivery = await deliverBookingReceived(booking._id, 'customer');
      delivery.success ? (result.sent += 1) : (result.failed += 1);
    }
    if (booking.notifications?.bookingReceivedProvider?.status === 'failed') {
      result.attempted += 1;
      const delivery = await deliverBookingReceived(booking._id, 'provider');
      delivery.success ? (result.sent += 1) : (result.failed += 1);
    }
    if (booking.confirmationEmail?.status === 'failed') {
      result.attempted += 1;
      const delivery = await sendBookingConfirmation(booking._id);
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: delivery?.success
            ? { 'confirmationEmail.status': 'sent', 'confirmationEmail.sentAt': new Date(), 'confirmationEmail.error': null }
            : { 'confirmationEmail.status': 'failed', 'confirmationEmail.error': String(delivery?.error || 'Email delivery failed') },
        }
      );
      delivery?.success ? (result.sent += 1) : (result.failed += 1);
    }
    if (booking.notifications?.cancellationCustomer?.status === 'failed') {
      result.attempted += 1;
      const delivery = await notifyBookingCancellation(booking._id, { reason: 'Booking cancelled' });
      delivery?.success ? (result.sent += 1) : (result.failed += 1);
    }
    if (booking.notifications?.cancellationProvider?.status === 'failed') {
      result.attempted += 1;
      const delivery = await notifyProviderCancellation(booking._id, { reason: 'Booking cancelled' });
      delivery?.success ? (result.sent += 1) : (result.failed += 1);
    }
  }

  return result;
};
