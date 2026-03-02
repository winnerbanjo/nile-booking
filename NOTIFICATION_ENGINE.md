# 🚀 Nile Booking Notification Engine

## Phase 7: WhatsApp & Notification Engine - Complete

The Notification Engine is the automated heartbeat that makes Nile Booking feel like a business that's always "on." It handles WhatsApp and Email notifications with rich formatting and automated scheduling.

---

## 📱 Features Implemented

### 1. **WhatsApp Notifications**
- ✅ Rich card formatting for booking confirmations
- ✅ 24-hour reminder system
- ✅ Merchant alerts for new bookings
- ✅ Cancellation notifications
- ✅ Mock system with detailed logging for development
- ✅ WhatsApp Business API structure ready for production

### 2. **Email Notifications**
- ✅ HTML email templates with Liquid Glass design
- ✅ Booking confirmations with receipt links
- ✅ 24-hour reminders
- ✅ Merchant alerts
- ✅ Tech Empire footer branding

### 3. **Automated Scheduling**
- ✅ 24-hour reminder system (checks every hour)
- ✅ Cron job setup for production
- ✅ Development mode with 5-minute intervals
- ✅ Prevents duplicate reminders

### 4. **Notification Preferences**
- ✅ User preferences stored in database
- ✅ Toggle WhatsApp notifications on/off
- ✅ Toggle Email notifications on/off
- ✅ Toggle WhatsApp reminders on/off
- ✅ Toggle Email receipts on/off
- ✅ API endpoints for managing preferences

---

## 🏗️ Architecture

### **Notification Service** (`server/services/notificationService.js`)

#### Core Functions:
- `sendWhatsAppNotification()` - Sends WhatsApp messages with rich formatting
- `sendEmailNotification()` - Sends HTML email notifications
- `scheduleReminders()` - Checks and sends 24-hour reminders
- `notifyPaymentConfirmation()` - Triggers on payment success
- `notifyBookingCancellation()` - Triggers on cancellation

#### Message Types:
1. **booking_confirmed** - Sent to customer when payment is confirmed
2. **reminder_24h** - Sent 24 hours before appointment
3. **merchant_alert** - Sent to provider when new booking arrives
4. **booking_cancelled** - Sent when booking is cancelled

### **Notification Controller** (`server/controllers/notificationController.js`)

- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/reminders/check` - Manual reminder check (for cron)

### **Database Schema Updates**

#### User Model:
```javascript
notificationPreferences: {
  whatsappEnabled: Boolean (default: true),
  emailEnabled: Boolean (default: true),
  whatsappReminders: Boolean (default: true),
  emailReceipts: Boolean (default: true),
}
```

#### Booking Model:
```javascript
reminderSent: Boolean (default: false) // Prevents duplicate reminders
```

---

## 🔧 Integration Points

### **Payment Webhooks**
- Paystack webhook → `notifyPaymentConfirmation()`
- Flutterwave webhook → `notifyPaymentConfirmation()`

### **Booking Status Updates**
- Status changed to 'confirmed' → `notifyPaymentConfirmation()`
- Status changed to 'cancelled' → `notifyBookingCancellation()`

### **Scheduled Jobs**
- Cron job runs every hour → `scheduleReminders()`
- Checks bookings 23-25 hours away
- Sends reminders if not already sent

---

## 📝 Message Format (Expertise, Organized Tone)

### Customer Confirmation:
```
✅ [Provider Name] | Booking Confirmed

Hello [Customer Name]!

Your session for "[Service Name]" is confirmed for [Date] at [Time].

Booking #[Number]
Amount Paid: ₦[Amount]

View your receipt: [Link]

Powered by Nile Booking
```

### 24-Hour Reminder:
```
🔔 Reminder | See you tomorrow!

Hello [Customer Name]!

Your appointment with [Provider] for "[Service]" is in 24 hours.

Date: [Date]
Time: [Time]
Booking #[Number]

Need to reschedule? Reply to this message or visit: [Link]

Powered by Nile Booking
```

### Merchant Alert:
```
💰 Nile Alert | New Booking!

[Customer] just booked "[Service]" for [Date] at [Time].

Booking #[Number]
Customer: [Name]
Phone: [Phone]
Email: [Email]

₦[Amount] has been added to your escrow.

View booking: [Link]

Powered by Nile Booking
```

---

## 🚀 Setup & Configuration

### **Environment Variables**
```env
# WhatsApp API (optional for development)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your_api_key

# Email Service (optional for development)
EMAIL_SERVICE_URL=smtp://smtp.example.com
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@nilebooking.com

# Client URL (for links in notifications)
CLIENT_URL=http://localhost:3000

# Cron Secret (for secure reminder endpoint)
CRON_SECRET=your_secret_key
```

### **Starting the Reminder Job**

#### Option 1: In Server.js (Production)
```javascript
import { startReminderJob } from './jobs/reminderJob.js';

// After connecting to database
startReminderJob();
```

#### Option 2: External Cron Service
Use EasyCron or similar to hit:
```
POST /api/notifications/reminders/check
Headers: x-cron-secret: your_secret_key
```

#### Option 3: Development Mode
```javascript
import { startReminderJobDev } from './jobs/reminderJob.js';
startReminderJobDev(); // Checks every 5 minutes
```

---

## 🧪 Testing

### **Mock Mode (Development)**
When `WHATSAPP_API_KEY` or `EMAIL_API_KEY` is not set, the service runs in mock mode:
- Detailed console logging
- WhatsApp links generated for manual testing
- Email HTML preview in logs
- No actual messages sent

### **Test Notification Flow**
1. Create a booking with payment
2. Verify payment via webhook
3. Check console for notification logs
4. Use generated WhatsApp link to test manually
5. Check email HTML in logs

---

## 📊 Dashboard Integration

### **Notification Preferences UI**
Add to Settings page:
- Toggle switches for each preference
- Save button calls `PUT /api/notifications/preferences`
- Real-time updates

### **Notification Logs**
Future enhancement:
- Display notification history in dashboard
- Show delivery status
- Retry failed notifications

---

## 🎨 Design Principles

### **Tone: "Expertise, Organized"**
- Professional but friendly
- Clear and concise
- Uses pipes (|) instead of em dashes
- Consistent branding

### **Visual Design**
- HTML emails use Liquid Glass aesthetic
- Consistent with landing page design
- Tech Empire footer on all emails
- Mobile-responsive templates

---

## ✅ Checklist

- [x] Notification service created
- [x] WhatsApp notification system
- [x] Email notification system
- [x] 24-hour reminder scheduling
- [x] Payment confirmation triggers
- [x] Cancellation notifications
- [x] Merchant alerts
- [x] Notification preferences API
- [x] Database schema updates
- [x] Cron job setup
- [x] Mock logging system
- [x] Integration with payment webhooks
- [x] Integration with booking controller

---

## 🚧 Future Enhancements

1. **SMS Notifications** - Add SMS fallback for WhatsApp
2. **Notification History** - Track all sent notifications
3. **Retry Logic** - Retry failed notifications
4. **Template Customization** - Allow merchants to customize messages
5. **Multi-language Support** - Support multiple languages
6. **Rich Media** - Add images/videos to WhatsApp messages
7. **Analytics** - Track notification open rates

---

## 📚 API Documentation

### **Get Notification Preferences**
```
GET /api/notifications/preferences
Headers: Authorization: Bearer <token>
```

### **Update Notification Preferences**
```
PUT /api/notifications/preferences
Headers: Authorization: Bearer <token>
Body: {
  whatsappEnabled: boolean,
  emailEnabled: boolean,
  whatsappReminders: boolean,
  emailReceipts: boolean
}
```

### **Check Reminders (Cron)**
```
POST /api/notifications/reminders/check
Headers: x-cron-secret: <secret>
```

---

**The Notification Engine is now live and ready to automate the booking experience!** 🎉
