import express from 'express';
import { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword, getMe, updateProfile, updateOnboarding } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.patch('/onboarding', protect, updateOnboarding);

export default router;
