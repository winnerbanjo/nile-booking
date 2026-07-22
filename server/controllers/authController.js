import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import jwt from 'jsonwebtoken';
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
          weeklySchedule: [
            { day: 'monday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
            { day: 'tuesday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
            { day: 'wednesday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
            { day: 'thursday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
            { day: 'friday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
            { day: 'saturday', isOpen: true, slots: [{ startTime: '10:00', endTime: '16:00' }] },
          ],
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
    const { name, email, password, businessName, phone, country } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (getMockMode()) {
      const slug = (businessName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const mockUser = {
        _id: `mock_user_${Date.now()}`,
        name,
        email: cleanEmail,
        password,
        role: 'provider',
        businessName: businessName || name,
        slug,
        phone: phone || '+2348123456789',
        country: country || 'Nigeria',
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

      return res.status(201).json({
        message: 'Registration initiated. Please verify your 6-digit OTP code.',
        email: cleanEmail,
        requiresOtp: true,
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const slug = (businessName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: 'provider',
      businessName: businessName || name,
      slug,
      phone,
      country: country || 'Nigeria',
      isVerified: false,
      otpCode,
      otpExpires,
    });

    await Schedule.create({
      provider: user._id,
      weeklySchedule: [
        { day: 'monday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { day: 'tuesday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { day: 'wednesday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { day: 'thursday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { day: 'friday', isOpen: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
        { day: 'saturday', isOpen: true, slots: [{ startTime: '10:00', endTime: '16:00' }] },
      ],
    });

    await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `Your Nile Booking Verification Code: ${otpCode}`,
      htmlContent: `<h2>Verification Code</h2><p>Your 6-digit OTP code to verify your Nile Booking merchant account is:</p><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1><p>This code expires in 15 minutes.</p>`,
      category: 'OTP Verification',
    });

    console.log(`\n\n=== 🔐 [AUTH] OTP GENERATED ===\nEmail: ${cleanEmail}\nOTP Code: ${otpCode}\n==============================\n\n`);

    res.status(201).json({
      message: 'Registration initiated. Please verify your 6-digit OTP code.',
      email: user.email,
      requiresOtp: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    await user.save();

    await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `🎉 Congratulations! Your Nile Website is Live: nilebooking.co/p/${user.slug}`,
      htmlContent: `<h1>Congratulations ${user.name}!</h1><p>Your signup is complete and your professional website is live at:</p><h3 style="color:#22c55e;"><a href="https://nilebooking.co/p/${user.slug}">https://nilebooking.co/p/${user.slug}</a></h3><p>Log in to your dashboard anytime to manage your bookings and services.</p>`,
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
      return res.json({ message: 'New OTP sent successfully' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `Your New Nile Verification Code: ${otpCode}`,
      htmlContent: `<h2>New Verification Code</h2><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1>`,
      category: 'OTP Verification',
    });

    console.log(`\n\n=== 🔐 [AUTH] NEW OTP REQUESTED ===\nEmail: ${cleanEmail}\nOTP Code: ${otpCode}\n==================================\n\n`);

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
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Auto-seed demo accounts if trying demo emails
    if (email === 'barber@nile.ng' || email === 'admin@nile.ng') {
      await ensureDemoAccount(email);
    }

    if (getMockMode()) {
      let mockUser = mockUsers.get(email);
      if (!mockUser && (email === 'barber@nile.ng' || email === 'admin@nile.ng')) {
        mockUser = {
          _id: `mock_${email}`,
          name: email === 'barber@nile.ng' ? 'The Modern Barber' : 'Nile Administrator',
          email,
          password: 'password123',
          role: email === 'admin@nile.ng' ? 'admin' : 'provider',
          businessName: 'The Modern Barber',
          slug: 'the-modern-barber',
          comparePassword: async (p) => p === 'password123',
        };
        mockUsers.set(email, mockUser);
      }

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
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    let user = await User.findOne({ email }).select('+password');
    if (!user && (email === 'barber@nile.ng' || email === 'admin@nile.ng')) {
      user = await ensureDemoAccount(email);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    let userFound = false;

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (mockUser) {
        mockUser.otpCode = otpCode;
        mockUser.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        userFound = true;
      }
    }

    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.otpCode = otpCode;
      user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      userFound = true;
    }

    // Even if user not found, we send the email to prevent email enumeration attacks (security best practice),
    // but in a real app you might want to silently ignore. Here we just proceed to send it.

    // Dispatch reset email via Mailtrap API
    await sendMailtrapApiEmail({
      toEmail: cleanEmail,
      toName: cleanEmail,
      subject: `Reset Your Nile Password: ${otpCode}`,
      htmlContent: `<h2>Password Reset Requested</h2><p>Your 6-digit OTP code to reset your Nile Booking account password is:</p><h1 style="font-size:32px;letter-spacing:6px;color:#22c55e;">${otpCode}</h1><p>This code expires in 15 minutes.</p>`,
      category: 'Password Reset',
    });

    console.log(`\n\n=== 🔐 [AUTH] PASSWORD RESET OTP GENERATED ===\nEmail: ${cleanEmail}\nOTP Code: ${otpCode}\n=============================================\n\n`);

    res.json({ message: 'Password reset OTP code sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password Execution
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let resetSuccessful = false;
    let userName = cleanEmail;

    if (getMockMode()) {
      const mockUser = mockUsers.get(cleanEmail);
      if (mockUser) {
        if (mockUser.otpCode !== otpCode.trim()) {
          return res.status(400).json({ message: 'Invalid or expired OTP code' });
        }
        mockUser.password = newPassword;
        mockUser.otpCode = null;
        mockUser.comparePassword = async (p) => p === newPassword;
        resetSuccessful = true;
        userName = mockUser.name;
      }
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (user) {
      if (user.otpCode !== otpCode.trim()) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
      }
      user.password = newPassword;
      user.otpCode = null;
      user.otpExpires = null;
      await user.save();
      resetSuccessful = true;
      userName = user.name;
    }

    if (!resetSuccessful) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    await sendMailtrapApiEmail({
      toEmail: cleanEmail,
      toName: userName,
      subject: `Security Alert: Your Nile Password Has Been Reset`,
      htmlContent: `<h2>Password Reset Successful</h2><p>Hello ${userName}, your Nile Booking password was updated successfully.</p>`,
      category: 'Security Alert',
    });

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
