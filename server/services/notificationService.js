import axios from 'axios';
import { DateTime } from 'luxon';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

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
  const receiptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${booking.bookingNumber}`;
  const message = encodeURIComponent(
    `Hello ${booking.customer.name}! Your session for ${booking.service.name} with ${provider.businessName || provider.name} is confirmed for ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.timeSlot.startTime} | View your receipt: ${receiptUrl}`
  );
  const providerPhone = provider.phone || booking.customer.phone;
  return `https://wa.me/${providerPhone.replace(/[^0-9]/g, '')}?text=${message}`;
};

export const sendWhatsAppNotification = async (booking, type = 'booking_confirmed', options = {}) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone');
    
    if (!bookingPopulated) return { success: false, error: 'Booking not found' };

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    const receiptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${bookingPopulated.bookingNumber}`;
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
    const receiptUrl = `${process.env.CLIENT_URL || 'https://nilebooking.co'}/bookings/${bookingPopulated.bookingNumber}`;
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
          <p>Hello ${customer.name}, your payment for <strong>${service?.name || 'your appointment'}</strong> with ${providerName} has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
            <tr><td style="padding:6px 0;color:#71717a;">Reference</td><td style="padding:6px 0;font-weight:600;">${bookingPopulated.bookingNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Service</td><td style="padding:6px 0;font-weight:600;">${service?.name || 'Appointment'}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Date</td><td style="padding:6px 0;font-weight:600;">${formattedDate}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Time</td><td style="padding:6px 0;font-weight:600;">${formattedTime}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Amount paid</td><td style="padding:6px 0;font-weight:600;">${formatMoney(amountPaid, currency)}</td></tr>
            ${balanceDue > 0 ? `<tr><td style="padding:6px 0;color:#71717a;">Balance due</td><td style="padding:6px 0;font-weight:600;">${formatMoney(balanceDue, currency)}</td></tr>` : ''}
          </table>
          ${providerContact ? `<p style="font-size:13px;color:#3f3f46;">Questions? Contact ${providerName}: ${providerContact}</p>` : ''}
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
      .populate('service', 'name')
      .populate('provider', 'name businessName phone email');

    if (!booking) return { success: false, error: 'Booking not found' };
    if (!booking.customer?.email) return { success: false, error: 'Customer has no email address' };

    const providerName = booking.provider?.businessName || booking.provider?.name || 'your provider';
    const providerContact = booking.provider?.email || booking.provider?.phone || '';
    const heading = outcome === 'rejected' ? 'Payment Not Accepted' : 'Booking Cancelled';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; padding: 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #09090b;">${heading}</h2>
          <p>Hello ${booking.customer.name}, your booking <strong>${booking.bookingNumber}</strong> for ${booking.service?.name || 'your appointment'} with ${providerName} is not going ahead.</p>
          ${reason ? `<p style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;">${reason}</p>` : ''}
          <p>The time has been released. You can book another slot on the provider's page.</p>
          ${providerContact ? `<p style="font-size:13px;color:#3f3f46;">Contact ${providerName}: ${providerContact}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    return await sendMailtrapApiEmail({
      toEmail: booking.customer.email,
      toName: booking.customer.name,
      subject: `${heading} | ${booking.bookingNumber}`,
      htmlContent,
      category: 'Booking Cancellation',
    });
  } catch (error) {
    console.error('❌ notifyBookingCancellation error:', error);
    return { success: false, error: error.message };
  }
};
