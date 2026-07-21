import axios from 'axios';
import Booking from '../models/Booking.js';
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

    console.log(`✅ Mailtrap Email Sent to ${toEmail} | Response:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Mailtrap API error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
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

export const sendBookingConfirmation = async (booking) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone email');
    
    if (!bookingPopulated) return { success: false, error: 'Booking not found' };

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    const receiptUrl = `${process.env.CLIENT_URL || 'https://nilebooking.co'}/bookings/${bookingPopulated.bookingNumber}`;
    const bookingDate = new Date(bookingPopulated.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; padding: 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #09090b;">Booking Confirmed!</h2>
          <p>Hello ${customer.name}, your booking for <strong>${service.name}</strong> with ${provider.businessName || provider.name} on ${formattedDate} at ${bookingPopulated.timeSlot.startTime} is confirmed.</p>
          <p><strong>Booking #:</strong> ${bookingPopulated.bookingNumber}</p>
          <a href="${receiptUrl}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Receipt</a>
        </div>
      </body>
      </html>
    `;

    return await sendMailtrapApiEmail({
      toEmail: customer.email,
      toName: customer.name,
      subject: `Booking Confirmed | ${service.name} with ${provider.businessName || provider.name}`,
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

export const notifyBookingCancellation = async (bookingId) => {
  return { success: true };
};
