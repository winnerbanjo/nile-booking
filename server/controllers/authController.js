import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getMockMode, mockUsers } from '../utils/mockMode.js';
import { sendMailtrapApiEmail } from '../services/notificationService.js';
import { uploadImage } from '../services/cloudinaryService.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '30d',
  });
};

// Auto-seed demo accounts in MongoDB Atlas if missing
const ensureDemoAccount = async (email, role = 'provider') => {
  try {
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      const isBarber = email.includes('barber');
      user = await User.create({
        name: isBarber ? 'The Modern Barber' : 'Nile Administrator',
        email,
        password: 'password123',
        role: isBarber ? 'provider' : 'admin',
        businessName: isBarber ? 'The Modern Barber' : 'Nile Technologies Inc',
        slug: isBarber ? 'the-modern-barber' : 'nile-admin',
        phone: '+2348123843076',
        isVerified: true,
      });

      if (isBarber) {
        await Schedule.create({
          provider: user._id,
          weeklySchedule: {
            monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
            tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
            wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
            thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
            friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
            saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
            sunday: { enabled: false, timeSlots: [] },
          },
        });
      }
    }
    return user;
  } catch (e) {
    console.error('Demo account seed note:', e.message);
    return null;
  }
};

// @desc    Register provider
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, businessName, phone, country, industry, slug, bankName, accountName, accountNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const normalizedAccountNumber = String(accountNumber || '').trim();

    if (bankName || accountName || accountNumber) {
      if (!bankName || !accountName || !accountNumber) {
        return res.status(400).json({ message: 'Please fill in all payout details (Bank Name, Account Name, and Account Number).' });
      }
      if (!/^\d{10}$/.test(normalizedAccountNumber)) {
        return res.status(400).json({ message: 'Account number must be exactly 10 digits.' });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (getMockMode()) {
      const finalSlug = slug || (businessName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const mockUser = {
        _id: `mock_user_${Date.now()}`,
        name,
        email: cleanEmail,
        password,
        role: 'provider',
        businessName: businessName || name,
        slug: finalSlug,
        phone: phone || '+2348123456789',
        country: country || 'Nigeria',
        industry: industry || 'other',
        bankAccount: { bankName: bankName?.trim(), accountName: accountName?.trim(), accountNumber: normalizedAccountNumber },
        isVerified: false,
        otpCode,
        otpExpires,
        comparePassword: async (candidatePassword) => candidatePassword === password,
      };
      mockUsers.set(cleanEmail, mockUser);

      await sendMailtrapApiEmail({
        toEmail: cleanEmail,
        toName: name,
        subject: `Your Nile Booking Verification Code: ${otpCode}`,
        htmlContent: `<h2>Verification Code</h2><p>Your 6-digit OTP code to verify your Nile Booking merchant account is:</p><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1><p>This code expires in 15 minutes.</p>`,
        category: 'OTP Verification',
      });

      console.log(`[AUTH] OTP GENERATED for ${cleanEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)}`);

      return res.status(201).json({
        message: 'Registration initiated. Please verify your 6-digit OTP code.',
        email: cleanEmail,
        requiresOtp: true,
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ message: 'An account with this email already exists. Try signing in instead.' });
      } else {
        await Schedule.deleteOne({ provider: userExists._id });
        await User.deleteOne({ _id: userExists._id });
      }
    }

    let finalSlug = slug || (businessName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingSlug = await User.findOne({ slug: finalSlug });
    if (existingSlug && existingSlug.email !== cleanEmail) {
      return res.status(400).json({ message: 'That website URL is already taken. Please choose another.' });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: 'provider',
      businessName: businessName || name,
      slug: finalSlug,
      phone,
      country: country || 'Nigeria',
      industry: industry || 'other',
      bankAccount: {
        bankName: bankName ? bankName.trim() : undefined,
        accountName: accountName ? accountName.trim() : undefined,
        accountNumber: normalizedAccountNumber || undefined
      },
      isVerified: false,
      otpCode,
      otpExpires,
    });

    await Schedule.create({
      provider: user._id,
      weeklySchedule: {
        monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
        tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
        wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
        thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
        friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
        saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
        sunday: { enabled: false, timeSlots: [] },
      },
    });

    const emailResult = await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `Your Nile Booking Verification Code: ${otpCode}`,
      htmlContent: `<h2>Verification Code</h2><p>Your 6-digit OTP code to verify your Nile Booking merchant account is:</p><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1><p>This code expires in 15 minutes.</p>`,
      category: 'OTP Verification',
    });

    console.log(`[AUTH] OTP GENERATED for ${cleanEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)}`);

    if (!emailResult.success) {
      console.error('Mailtrap rejected the email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Mailtrap may have blocked it. Please check terminal logs for the OTP.' });
    }

    res.status(201).json({
      message: 'Registration initiated. Please verify your 6-digit OTP code.',
      email: user.email,
      requiresOtp: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A user with this information already exists.' });
    }
    res.status(400).json({ message: error.message || 'Registration failed. Please check your details.' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (!mockUser || mockUser.otpCode !== otpCode.trim()) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
      }
      mockUser.isVerified = true;
      mockUser.otpCode = null;

      await sendMailtrapApiEmail({
        toEmail: cleanEmail,
        toName: mockUser.name,
        subject: `🎉 Congratulations! Your Nile Website is Live: nilebooking.co/p/${mockUser.slug}`,
        htmlContent: `<h1>Congratulations ${mockUser.name}!</h1><p>Your signup is complete and your professional website is live at:</p><h3 style="color:#22c55e;"><a href="https://nilebooking.co/p/${mockUser.slug}">https://nilebooking.co/p/${mockUser.slug}</a></h3><p>Log in to your dashboard anytime to manage your bookings and services.</p>`,
        category: 'Welcome Onboarding',
      });

      return res.json({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        slug: mockUser.slug,
        businessName: mockUser.businessName,
        isVerified: true,
        token: generateToken(mockUser._id),
      });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || user.otpCode !== otpCode.trim()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    if (!user.onboarding) user.onboarding = {};
    user.onboarding.websiteGenerated = true;
    await user.save();

    await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `🎉 Your Nile Booking website is live: ${user.slug}.nilebooking.co`,
      htmlContent: `<h1>Welcome, ${user.name}!</h1><p>Your booking website is live at:</p><h3 style="color:#22c55e;"><a href="https://${user.slug}.nilebooking.co">https://${user.slug}.nilebooking.co</a></h3><p>Log in to your dashboard to add your services and start receiving bookings.</p>`,
      category: 'Welcome Onboarding',
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      businessName: user.businessName,
      isVerified: true,
      onboarding: user.onboarding,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (mockUser) mockUser.otpCode = otpCode;
      await sendMailtrapApiEmail({
        toEmail: cleanEmail,
        toName: mockUser?.name || 'Merchant',
        subject: `Your New Nile Verification Code: ${otpCode}`,
        htmlContent: `<h2>New Verification Code</h2><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1>`,
        category: 'OTP Verification',
      });

      console.log(`\n\n=== 🔐 [AUTH] NEW OTP REQUESTED (MOCK MODE) ===\nEmail: ${cleanEmail}\nOTP Code: ${otpCode}\n==================================\n\n`);

      return res.json({ message: 'New OTP sent successfully' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const emailResult = await sendMailtrapApiEmail({
      toEmail: cleanEmail,
      toName: user.name,
      subject: `Your New Nile Verification Code: ${otpCode}`,
      htmlContent: `<h2>New Verification Code</h2><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1>`,
      category: 'OTP Verification',
    });

    console.log(`[AUTH] NEW OTP REQUESTED for ${cleanEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)}`);

    if (!emailResult.success) {
      console.error('Mailtrap rejected the email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Mailtrap may have blocked it. Please check terminal logs for the OTP.' });
    }

    res.json({ message: 'New OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login provider
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in this field to continue.' });
    }

    if (getMockMode()) {
      let mockUser = mockUsers.get(email);

      if (mockUser && (await mockUser.comparePassword(password))) {
        return res.json({
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          slug: mockUser.slug,
          businessName: mockUser.businessName,
          token: generateToken(mockUser._id),
        });
      }
      return res.status(401).json({
        message: "The password you entered doesn't match this account. Please try again or reset your password if you've forgotten it.",
      });
    }

    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        message: "We couldn't find a merchant account associated with this email address.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "The password you entered doesn't match this account. Please try again or reset your password if you've forgotten it.",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      businessName: user.businessName,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "We couldn't complete your request right now. Please try again in a moment." });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (!mockUser) {
        return res.status(404).json({ message: "We couldn't find a merchant account using that email address. Please check the spelling or create a new storefront if you haven't registered yet." });
      }
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      mockUser.otpCode = otpCode;
      mockUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await sendMailtrapApiEmail({
        toEmail: cleanEmail,
        toName: mockUser.name || 'Merchant',
        subject: `Your Nile Booking Reset Code: ${otpCode}`,
        htmlContent: `<h2>Password Reset Request</h2><p>Your 6-digit OTP code to reset your Nile Booking password is:</p><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1><p>This code expires in 10 minutes.</p>`,
        category: 'Password Reset',
      });

      return res.json({ message: "We've sent a 6-digit verification code to your email. Enter the code below to continue resetting your password." });
    }

    // Select +password so Mongoose required validation passes on user.save()
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ message: "We couldn't find a merchant account using that email address. Please check the spelling or create a new storefront if you haven't registered yet." });
    }

    // Cool-down check: prevent spamming OTP requests (< 30 seconds since last OTP issued)
    if (user.otpExpires) {
      const timeRemainingMs = new Date(user.otpExpires).getTime() - Date.now();
      if (timeRemainingMs > 570000 && timeRemainingMs <= 600000) {
        return res.status(429).json({ message: "For your security, we've temporarily paused sign-in. Please wait a few minutes before trying again." });
      }
    }

    // Cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    const emailResult = await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name || 'Merchant',
      subject: `Your Nile Booking Reset Code: ${otpCode}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #000; font-size: 20px;">Password Reset Request</h2>
          <p>Hello ${user.name || 'Merchant'},</p>
          <p>We received a request to reset your password for your Nile Booking merchant account.</p>
          <p>Your 6-digit reset code is:</p>
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e;">${otpCode}</span>
          </div>
          <p style="font-size: 13px; color: #666;">This code is valid for <strong>10 minutes</strong>.</p>
        </div>
      `,
      category: 'Password Reset',
    });

    console.log(`[AUTH] PASSWORD RESET OTP GENERATED for ${cleanEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)}`);

    if (!emailResult.success) {
      console.error('[AUTH] Mailtrap rejected password reset email:', emailResult.error);
      return res.status(500).json({ message: 'Something went wrong while sending your reset code. Please try again in a moment.' });
    }

    res.json({ message: "We've sent a 6-digit verification code to your email. Enter the code below to continue resetting your password." });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "We couldn't complete your request right now. Please try again in a moment." });
  }
};

// @desc    Reset Password Execution
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ message: 'Please fill in this field to continue.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Your password must be at least 8 characters long.' });
    }

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (!mockUser) {
        return res.status(404).json({ message: "We couldn't find a merchant account using that email address. Please check the spelling or create a new storefront if you haven't registered yet." });
      }
      if (!mockUser.otpCode || mockUser.otpCode !== cleanOtp) {
        return res.status(400).json({ message: 'Please check the 6-digit code and try again.' });
      }
      if (!mockUser.otpExpires || Date.now() > new Date(mockUser.otpExpires).getTime()) {
        mockUser.otpCode = null;
        mockUser.otpExpires = null;
        return res.status(400).json({ message: 'Your verification code has expired. Request a new one to continue.' });
      }
      mockUser.password = newPassword;
      mockUser.otpCode = null;
      mockUser.otpExpires = null;
      mockUser.comparePassword = async (p) => p === newPassword;
      return res.json({ message: 'Your password has been changed successfully. You can now sign in using your new password.' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ message: "We couldn't find a merchant account using that email address. Please check the spelling or create a new storefront if you haven't registered yet." });
    }

    if (!user.otpCode || user.otpCode !== cleanOtp) {
      return res.status(400).json({ message: 'Please check the 6-digit code and try again.' });
    }

    if (!user.otpExpires || Date.now() > new Date(user.otpExpires).getTime()) {
      user.otpCode = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({ message: 'Your verification code has expired. Request a new one to continue.' });
    }

    user.password = newPassword;
    user.otpCode = null;
    user.otpExpires = null;
    user.passwordChangedAt = new Date();
    await user.save();

    // Fire-and-forget security notification email
    sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name || 'Merchant',
      subject: `Security Alert: Your Nile Booking Password Has Been Reset`,
      htmlContent: `<h2>Password Updated</h2><p>Hello ${user.name || 'Merchant'}, your Nile Booking password was updated successfully.</p>`,
      category: 'Security Alert',
    }).catch((e) => console.error('[AUTH] Security notification failed:', e.message));

    res.json({ message: 'Your password has been changed successfully. You can now sign in using your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "We couldn't complete your request right now. Please try again in a moment." });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.json(req.user);
    }
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    if (getMockMode()) {
      const mockUser = mockUsers.get(req.user.email);
      if (mockUser) {
        Object.assign(mockUser, req.body);
        return res.json(mockUser);
      }
      return res.json({ ...req.user, ...req.body });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      businessName,
      phone,
      bio,
      location,
      logo,
      profileImage,
      headerImage,
      policies,
      address,
      bankAccount,
      socialHandles,
      paymentMethods,
    } = req.body;

    if (name) user.name = name;
    if (businessName) {
      user.businessName = businessName;
      user.slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (location) user.location = location;

    if (logo) {
      if (logo.startsWith('data:image')) {
        try {
          const uploaded = await uploadImage(logo, 'nile-booking/logos');
          user.logo = uploaded.url;
        } catch (e) {
          user.logo = logo;
        }
      } else {
        user.logo = logo;
      }
    }

    if (headerImage) {
      if (headerImage.startsWith('data:image')) {
        try {
          const uploaded = await uploadImage(headerImage, 'nile-booking/headers');
          user.headerImage = uploaded.url;
        } catch (e) {
          user.headerImage = headerImage;
        }
      } else {
        user.headerImage = headerImage;
      }
    }
    if (policies) user.policies = { ...user.policies, ...policies };
    if (address) user.address = { ...user.address, ...address };
    if (bankAccount) user.bankAccount = { ...user.bankAccount, ...bankAccount };
    if (socialHandles) user.socialHandles = { ...user.socialHandles, ...socialHandles };
    if (paymentMethods) user.paymentMethods = { ...user.paymentMethods, ...paymentMethods };

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update onboarding progress
// @route   PATCH /api/auth/onboarding
// @access  Private
export const updateOnboarding = async (req, res) => {
  try {
    const { firstServiceAdded, firstServiceSkipped, availabilityConfigured, onboardingCompleted } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.onboarding) user.onboarding = {};
    if (firstServiceAdded !== undefined) user.onboarding.firstServiceAdded = firstServiceAdded;
    if (firstServiceSkipped !== undefined) user.onboarding.firstServiceSkipped = firstServiceSkipped;
    if (availabilityConfigured !== undefined) user.onboarding.availabilityConfigured = availabilityConfigured;
    if (onboardingCompleted !== undefined) {
      user.onboarding.onboardingCompleted = onboardingCompleted;
      if (onboardingCompleted && !user.onboarding.completedAt) {
        user.onboarding.completedAt = new Date();
      }
    }

    user.markModified('onboarding');
    await user.save();
    res.json({ onboarding: user.onboarding });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
