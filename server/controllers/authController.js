import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import { getMockMode, mockUsers } from '../utils/mockMode.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '30d',
  });
};

// Generate slug from name
const generateSlug = async (name) => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let slug = baseSlug;
  let counter = 1;
  
    if (getMockMode()) {
      // Mock mode: simple slug generation
      return slug;
    }
  
  while (await User.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// @desc    Register provider
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, password, businessName, phone } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (getMockMode()) {
      // Mock mode: return error (registration not supported in mock mode)
      return res.status(503).json({ 
        message: 'Registration unavailable in mock mode. Please connect to database.' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate slug
    const slug = await generateSlug(businessName || name);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'provider',
      businessName: businessName || name,
      slug,
      phone,
    });

    // Create default schedule
    await Schedule.create({
      provider: user._id,
      weeklySchedule: {
        monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
        tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
        wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
        thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
        friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
      },
      bufferTime: 15,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        slug: user.slug,
        businessName: user.businessName,
        token: generateToken(user._id),
      });
    }
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

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Mock mode: Use mock users
    if (getMockMode()) {
      const mockUser = mockUsers.get(email);
      
      if (!mockUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if provider
      if (mockUser.role !== 'provider' && mockUser.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Provider account required.' });
      }

      // Check password
      const isMatch = await mockUser.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

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

    // Database mode: Use MongoDB
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if provider
    if (user.role !== 'provider' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Provider account required.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (getMockMode()) {
      // In mock mode, decode token to get user ID
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          const mockUser = Array.from(mockUsers.values()).find(u => u._id === decoded.id);
          if (mockUser) {
            return res.json({
              _id: mockUser._id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              slug: mockUser.slug,
              businessName: mockUser.businessName,
              phone: mockUser.phone,
              bio: mockUser.bio,
              location: mockUser.location,
              profileImage: mockUser.profileImage,
            });
          }
        } catch (err) {
          // Token invalid
        }
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      businessName: user.businessName,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { businessName, bio, location, profileImage } = req.body;

    if (getMockMode()) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          const mockUser = Array.from(mockUsers.values()).find(u => u._id === decoded.id);
          if (mockUser) {
            if (businessName !== undefined) mockUser.businessName = businessName;
            if (bio !== undefined) mockUser.bio = bio;
            if (location !== undefined) mockUser.location = location;
            if (profileImage !== undefined) mockUser.profileImage = profileImage;
            return res.json({
              _id: mockUser._id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              slug: mockUser.slug,
              businessName: mockUser.businessName,
              phone: mockUser.phone,
              bio: mockUser.bio,
              location: mockUser.location,
              profileImage: mockUser.profileImage,
            });
          }
        } catch (err) {
          // Token invalid
        }
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (businessName !== undefined) user.businessName = businessName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      businessName: user.businessName,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
