import axios from 'axios';
import nodemailer from 'nodemailer';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

/**
 * WhatsApp Notification Service
 * Handles automated WhatsApp messages with rich card formatting
 */

// Generate WhatsApp booking link with rich preview
export const generateWhatsAppLink = (booking, provider) => {
  const receiptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${booking.bookingNumber}`;
  
  const message = encodeURIComponent(
    `Hello ${booking.customer.name}! Your session for ${booking.service.name} with ${provider.businessName || provider.name} is confirmed for ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${booking.timeSlot.startTime} | View your receipt here: ${receiptUrl}`
  );
  
  const providerPhone = provider.phone || booking.customer.phone;
  return `https://wa.me/${providerPhone.replace(/[^0-9]/g, '')}?text=${message}`;
};

/**
 * Send WhatsApp notification to customer
 * Uses WhatsApp Business API structure for rich card previews
 */
export const sendWhatsAppNotification = async (booking, type = 'booking_confirmed', options = {}) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone');
    
    if (!bookingPopulated) {
      throw new Error('Booking not found');
    }

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    
    // Check if provider has WhatsApp notifications enabled
    const providerUser = await User.findById(provider._id);
    const notificationsEnabled = providerUser?.notificationPreferences?.whatsappEnabled !== false; // Default to true
    
    if (!notificationsEnabled && type !== 'merchant_alert') {
      console.log(`[NOTIFICATION SKIPPED] WhatsApp disabled for provider ${provider._id}`);
      return { success: true, skipped: true, reason: 'whatsapp_disabled' };
    }

    const receiptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${bookingPopulated.bookingNumber}`;
    const bookingDate = new Date(bookingPopulated.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = bookingPopulated.timeSlot.startTime;

    let message = '';
    let recipient = '';

    switch (type) {
      case 'booking_confirmed':
        message = `✅ ${provider.businessName || provider.name} | Booking Confirmed\n\n` +
          `Hello ${customer.name}!\n\n` +
          `Your session for "${service.name}" is confirmed for ${formattedDate} at ${formattedTime}.\n\n` +
          `Booking #${bookingPopulated.bookingNumber}\n` +
          `Amount Paid: ₦${bookingPopulated.pricing.depositAmount?.toLocaleString() || bookingPopulated.pricing.totalAmount.toLocaleString()}\n\n` +
          `View your receipt: ${receiptUrl}\n\n` +
          `Powered by Nile Booking`;
        recipient = customer.phone;
        break;

      case 'reminder_24h':
        message = `🔔 Reminder | See you tomorrow!\n\n` +
          `Hello ${customer.name}!\n\n` +
          `Your appointment with ${provider.businessName || provider.name} for "${service.name}" is in 24 hours.\n\n` +
          `Date: ${formattedDate}\n` +
          `Time: ${formattedTime}\n` +
          `Booking #${bookingPopulated.bookingNumber}\n\n` +
          `Need to reschedule? Reply to this message or visit: ${receiptUrl}\n\n` +
          `Powered by Nile Booking`;
        recipient = customer.phone;
        break;

      case 'merchant_alert':
        const depositAmount = bookingPopulated.pricing.depositAmount || bookingPopulated.pricing.totalAmount;
        message = `💰 Nile Alert | New Booking!\n\n` +
          `${customer.name} just booked "${service.name}" for ${formattedDate} at ${formattedTime}.\n\n` +
          `Booking #${bookingPopulated.bookingNumber}\n` +
          `Customer: ${customer.name}\n` +
          `Phone: ${customer.phone}\n` +
          `Email: ${customer.email}\n\n` +
          `₦${depositAmount.toLocaleString()} has been added to your escrow.\n\n` +
          `View booking: ${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/bookings/${bookingPopulated._id}\n\n` +
          `Powered by Nile Booking`;
        recipient = provider.phone;
        break;

      case 'booking_cancelled':
        message = `❌ Booking Cancelled\n\n` +
          `Hello ${customer.name},\n\n` +
          `Your booking for "${service.name}" with ${provider.businessName || provider.name} on ${formattedDate} at ${formattedTime} has been cancelled.\n\n` +
          `Booking #${bookingPopulated.bookingNumber}\n\n` +
          `If you have any questions, please contact us.\n\n` +
          `Powered by Nile Booking`;
        recipient = customer.phone;
        break;

      default:
        message = `Booking Update\n\nBooking #${bookingPopulated.bookingNumber} status: ${bookingPopulated.status}`;
        recipient = customer.phone;
    }

    // Mock implementation with detailed logging
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/mock';
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiKey || process.env.NODE_ENV === 'development') {
      // Detailed mock logging for development
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 WHATSAPP NOTIFICATION (MOCK)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Type: ${type}`);
      console.log(`Recipient: ${recipient}`);
      console.log(`Booking: #${bookingPopulated.bookingNumber}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Message:');
      console.log(message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Generate WhatsApp link for manual testing
      const whatsappLink = `https://wa.me/${recipient.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      console.log(`🔗 Test Link: ${whatsappLink}\n`);

      return { 
        success: true, 
        mock: true, 
        message,
        recipient,
        whatsappLink,
        type 
      };
    }

    // Real WhatsApp API integration (Twilio/WhatsApp Business API)
    const response = await axios.post(
      whatsappApiUrl,
      {
        to: recipient,
        message,
        type: 'template', // Use template for rich cards
        template: {
          name: type === 'booking_confirmed' ? 'booking_confirmation' : 'booking_update',
          language: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customer.name },
                { type: 'text', text: service.name },
                { type: 'text', text: formattedDate },
                { type: 'text', text: formattedTime },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, mock: false, data: response.data, type };
  } catch (error) {
    console.error('❌ WhatsApp notification error:', error);
    return { success: false, error: error.message, type };
  }
};

/**
 * Mailtrap Email Transport Configuration
 * Creates a Nodemailer transport using Mailtrap SMTP
 */
const createMailtrapTransport = () => {
  if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
    console.warn('⚠️ Mailtrap credentials not configured. Email sending will be mocked.');
    return null;
  }

  return nodemailer.createTransport({
    host: 'live.smtp.mailtrap.io',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
};

/**
 * Generate Nile Logo SVG for Email Templates
 * Returns inline SVG with Nile Green (#22c55e) color
 */
const getNileLogoSVG = () => {
  return `
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
      <path
        d="M8 8 C12 12, 20 20, 24 24 C28 28, 36 36, 40 40 M8 8 L8 40 M40 8 L40 40"
        stroke="#22c55e"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 8 Q16 16, 24 24 Q32 32, 40 8"
        stroke="#22c55e"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.6"
        fill="none"
      />
      <path
        d="M12 16 Q18 20, 24 24 Q30 28, 36 12"
        stroke="#22c55e"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.4"
        fill="none"
      />
    </svg>
  `;
};

/**
 * Send Booking Confirmation Email via Mailtrap
 * Beautiful HTML email with Nile Green logo
 */
export const sendBookingConfirmation = async (booking) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone email');
    
    if (!bookingPopulated) {
      throw new Error('Booking not found');
    }

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    
    const receiptUrl = `${process.env.CLIENT_URL || 'https://nilebooking.co'}/bookings/${bookingPopulated.bookingNumber}`;
    const bookingDate = new Date(bookingPopulated.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const nileLogo = getNileLogoSVG();
    const depositAmount = bookingPopulated.pricing.depositAmount || bookingPopulated.pricing.totalAmount;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
      </head>
      <body style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f7;">
        <div style="background: linear-gradient(to bottom, #ffffff, #f5f5f7); padding: 40px 20px; border-radius: 24px;">
          <!-- Nile Logo Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            ${nileLogo}
            <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #22c55e; letter-spacing: -0.01em;">
              Nile Booking
            </div>
          </div>
          
          <h1 style="font-size: 32px; font-weight: 900; color: #111827; margin-bottom: 8px; letter-spacing: -0.02em; text-align: center;">
            Booking Confirmed
          </h1>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 32px; text-align: center;">
            ${provider.businessName || provider.name} | Expertise, Organized
          </p>
          
          <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
            <p style="font-size: 18px; color: #111827; margin-bottom: 16px; font-weight: 600;">
              Hello ${customer.name}!
            </p>
            <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px; line-height: 1.6;">
              Your session for <strong style="color: #111827;">"${service.name}"</strong> is confirmed for ${formattedDate} at ${bookingPopulated.timeSlot.startTime}.
            </p>
            
            <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 20px; margin-top: 20px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Booking Number:</span>
                <span style="font-size: 14px; color: #111827; font-weight: 700; margin-left: 8px;">${bookingPopulated.bookingNumber}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Amount Paid:</span>
                <span style="font-size: 16px; color: #22c55e; font-weight: 700; margin-left: 8px;">₦${depositAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${receiptUrl}" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
              View Receipt
            </a>
          </div>
          
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Powered by Nile Booking | <a href="${process.env.CLIENT_URL || 'https://nilebooking.co'}" style="color: #22c55e; text-decoration: none;">nilebooking.co</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createMailtrapTransport();
    
    if (!transporter) {
      // Mock mode - log email details
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 BOOKING CONFIRMATION EMAIL (MOCK)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${customer.email}`);
      console.log(`Subject: Booking Confirmed | ${service.name} with ${provider.businessName || provider.name}`);
      console.log(`Booking: #${bookingPopulated.bookingNumber}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return { 
        success: true, 
        mock: true, 
        recipient: customer.email,
        bookingNumber: bookingPopulated.bookingNumber
      };
    }

    // Send email via Mailtrap
    const info = await transporter.sendMail({
      from: `"Nile Booking" <${process.env.MAILTRAP_FROM_EMAIL || 'noreply@nilebooking.co'}>`,
      to: customer.email,
      subject: `Booking Confirmed | ${service.name} with ${provider.businessName || provider.name}`,
      html: htmlContent,
    });

    console.log(`✅ Booking confirmation email sent to ${customer.email} | Message ID: ${info.messageId}`);

    return { 
      success: true, 
      mock: false, 
      messageId: info.messageId,
      recipient: customer.email,
      bookingNumber: bookingPopulated.bookingNumber
    };
  } catch (error) {
    console.error('❌ Booking confirmation email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email Notification Service
 * Handles automated email notifications with HTML templates
 */
export const sendEmailNotification = async (booking, type = 'booking_confirmed', options = {}) => {
  try {
    const bookingPopulated = await Booking.findById(booking._id || booking)
      .populate('service', 'name description price duration')
      .populate('provider', 'name businessName phone email');
    
    if (!bookingPopulated) {
      throw new Error('Booking not found');
    }

    const provider = bookingPopulated.provider;
    const service = bookingPopulated.service;
    const customer = bookingPopulated.customer;
    
    // Check if provider has email notifications enabled
    const providerUser = await User.findById(provider._id);
    const emailEnabled = providerUser?.notificationPreferences?.emailEnabled !== false; // Default to true
    
    if (!emailEnabled && type !== 'merchant_alert') {
      console.log(`[NOTIFICATION SKIPPED] Email disabled for provider ${provider._id}`);
      return { success: true, skipped: true, reason: 'email_disabled' };
    }

    const receiptUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings/${bookingPopulated.bookingNumber}`;
    const bookingDate = new Date(bookingPopulated.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let subject = '';
    let htmlContent = '';
    let recipient = '';

    switch (type) {
      case 'booking_confirmed':
        subject = `Booking Confirmed | ${service.name} with ${provider.businessName || provider.name}`;
        recipient = customer.email;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmed</title>
          </head>
          <body style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to bottom, #ffffff, #f5f5f7); padding: 40px 20px; border-radius: 24px;">
              <!-- Nile Logo Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                ${getNileLogoSVG()}
                <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #22c55e; letter-spacing: -0.01em;">
                  Nile Booking
                </div>
              </div>
              <h1 style="font-size: 32px; font-weight: 900; color: #09090b; margin-bottom: 8px; letter-spacing: -0.02em; text-align: center;">
                Booking Confirmed
              </h1>
              <p style="font-size: 16px; color: #71717a; margin-bottom: 32px; text-align: center;">
                ${provider.businessName || provider.name} | Expertise, Organized
              </p>
              
              <div style="background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 24px; padding: 24px; margin-bottom: 24px;">
                <p style="font-size: 18px; color: #09090b; margin-bottom: 16px;">
                  Hello ${customer.name}!
                </p>
                <p style="font-size: 16px; color: #71717a; margin-bottom: 24px;">
                  Your session for <strong>"${service.name}"</strong> is confirmed for ${formattedDate} at ${bookingPopulated.timeSlot.startTime}.
                </p>
                
                <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 16px; margin-top: 16px;">
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Booking Number:</strong> ${bookingPopulated.bookingNumber}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Amount Paid:</strong> ₦${(bookingPopulated.pricing.depositAmount || bookingPopulated.pricing.totalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <a href="${receiptUrl}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
                View Receipt
              </a>
              
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  Powered by Nile Booking | <a href="${process.env.CLIENT_URL || 'https://nilebooking.co'}" style="color: #22c55e; text-decoration: none;">nilebooking.co</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'reminder_24h':
        subject = `Reminder | Your appointment is in 24 hours`;
        recipient = customer.email;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Reminder</title>
          </head>
          <body style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to bottom, #ffffff, #f5f5f7); padding: 40px 20px; border-radius: 24px;">
              <!-- Nile Logo Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                ${getNileLogoSVG()}
                <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #22c55e; letter-spacing: -0.01em;">
                  Nile Booking
                </div>
              </div>
              <h1 style="font-size: 32px; font-weight: 900; color: #09090b; margin-bottom: 8px; letter-spacing: -0.02em; text-align: center;">
                See you tomorrow!
              </h1>
              
              <div style="background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 24px; padding: 24px; margin-bottom: 24px;">
                <p style="font-size: 18px; color: #09090b; margin-bottom: 16px;">
                  Hello ${customer.name}!
                </p>
                <p style="font-size: 16px; color: #71717a; margin-bottom: 24px;">
                  Your appointment with <strong>${provider.businessName || provider.name}</strong> for "${service.name}" is in 24 hours.
                </p>
                
                <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 16px; margin-top: 16px;">
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Date:</strong> ${formattedDate}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Time:</strong> ${bookingPopulated.timeSlot.startTime}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Booking #:</strong> ${bookingPopulated.bookingNumber}
                  </p>
                </div>
              </div>
              
              <a href="${receiptUrl}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
                Need to Reschedule?
              </a>
              
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  Powered by Nile Booking | <a href="${process.env.CLIENT_URL || 'https://nilebooking.co'}" style="color: #22c55e; text-decoration: none;">nilebooking.co</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'merchant_alert':
        const depositAmount = bookingPopulated.pricing.depositAmount || bookingPopulated.pricing.totalAmount;
        subject = `New Booking | ${customer.name} booked ${service.name}`;
        recipient = provider.email;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Booking Alert</title>
          </head>
          <body style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to bottom, #ffffff, #f5f5f7); padding: 40px 20px; border-radius: 24px;">
              <!-- Nile Logo Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                ${getNileLogoSVG()}
                <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #22c55e; letter-spacing: -0.01em;">
                  Nile Booking
                </div>
              </div>
              <h1 style="font-size: 32px; font-weight: 900; color: #09090b; margin-bottom: 8px; letter-spacing: -0.02em; text-align: center;">
                💰 New Booking!
              </h1>
              
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 24px; padding: 24px; margin-bottom: 24px;">
                <p style="font-size: 18px; color: #09090b; margin-bottom: 16px;">
                  ${customer.name} just booked "${service.name}"
                </p>
                
                <div style="border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 16px; margin-top: 16px;">
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Date:</strong> ${formattedDate} at ${bookingPopulated.timeSlot.startTime}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Customer:</strong> ${customer.name}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Phone:</strong> ${customer.phone}
                  </p>
                  <p style="font-size: 14px; color: #71717a; margin: 8px 0;">
                    <strong>Email:</strong> ${customer.email}
                  </p>
                  <p style="font-size: 16px; color: #22c55e; font-weight: 700; margin-top: 16px;">
                    ₦${depositAmount.toLocaleString()} added to escrow
                  </p>
                </div>
              </div>
              
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/bookings/${bookingPopulated._id}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
                View Booking
              </a>
              
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  Powered by Nile Booking | <a href="${process.env.CLIENT_URL || 'https://nilebooking.co'}" style="color: #22c55e; text-decoration: none;">nilebooking.co</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        subject = `Booking Update | ${bookingPopulated.bookingNumber}`;
        recipient = customer.email;
        htmlContent = `<p>Booking #${bookingPopulated.bookingNumber} status: ${bookingPopulated.status}</p>`;
    }

    // Use Mailtrap transport for email sending
    const transporter = createMailtrapTransport();
    
    if (!transporter) {
      // Mock mode - log email details
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL NOTIFICATION (MOCK)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Type: ${type}`);
      console.log(`Recipient: ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(`Booking: #${bookingPopulated.bookingNumber}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return { 
        success: true, 
        mock: true, 
        subject,
        recipient,
        htmlContent,
        type 
      };
    }

    // Send email via Mailtrap
    const info = await transporter.sendMail({
      from: `"Nile Booking" <${process.env.MAILTRAP_FROM_EMAIL || 'noreply@nilebooking.co'}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent to ${recipient} | Type: ${type} | Message ID: ${info.messageId}`);

    return { success: true, mock: false, messageId: info.messageId, type };
  } catch (error) {
    console.error('❌ Email notification error:', error);
    return { success: false, error: error.message, type };
  }
};

/**
 * Schedule 24-hour reminder
 * This should be called by a cron job or scheduled task runner
 */
export const scheduleReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Find bookings that are exactly 24 hours away
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'pending'] },
      date: {
        $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        $lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
      reminderSent: { $ne: true }, // Only send if not already sent
    })
      .populate('service')
      .populate('provider', 'name businessName phone notificationPreferences');

    console.log(`\n🔔 Checking reminders for ${bookings.length} bookings...`);

    for (const booking of bookings) {
      const bookingTime = new Date(booking.date);
      bookingTime.setHours(
        parseInt(booking.timeSlot.startTime.split(':')[0]),
        parseInt(booking.timeSlot.startTime.split(':')[1]),
        0,
        0
      );

      const hoursUntil = (bookingTime - now) / (1000 * 60 * 60);

      // Send reminder if booking is between 23-25 hours away
      if (hoursUntil >= 23 && hoursUntil <= 25) {
        await sendWhatsAppNotification(booking, 'reminder_24h');
        await sendEmailNotification(booking, 'reminder_24h');
        
        booking.reminderSent = true;
        await booking.save();
        
        console.log(`✅ Reminder sent for booking #${booking.bookingNumber}`);
      }
    }

    return { success: true, remindersSent: bookings.length };
  } catch (error) {
    console.error('❌ Reminder scheduling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification for payment confirmation
 * Triggered when payment webhook confirms payment
 */
export const notifyPaymentConfirmation = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('provider', 'name businessName phone email notificationPreferences');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Send to customer
    await sendWhatsAppNotification(booking, 'booking_confirmed');
    await sendEmailNotification(booking, 'booking_confirmed');

    // Send to merchant
    await sendWhatsAppNotification(booking, 'merchant_alert');
    await sendEmailNotification(booking, 'merchant_alert');

    return { success: true };
  } catch (error) {
    console.error('❌ Payment confirmation notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification for booking cancellation
 */
export const notifyBookingCancellation = async (bookingId, cancelledBy = 'provider') => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('provider', 'name businessName phone email');

    if (!booking) {
      throw new Error('Booking not found');
    }

    await sendWhatsAppNotification(booking, 'booking_cancelled');
    await sendEmailNotification(booking, 'booking_cancelled');

    return { success: true };
  } catch (error) {
    console.error('❌ Cancellation notification error:', error);
    return { success: false, error: error.message };
  }
};
