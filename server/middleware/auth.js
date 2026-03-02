import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getMockMode, mockUsers } from '../utils/mockMode.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      if (getMockMode()) {
        const mockUser = Array.from(mockUsers.values()).find((user) => user._id === decoded.id);
        if (!mockUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        req.user = mockUser;
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const providerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'provider' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Provider role required.' });
  }
};
