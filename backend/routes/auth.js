const express = require('express');
const { body } = require('express-validator');
const { sendOtp, verifyOtp, checkEmail, register, login, getMe, submitVerification, resetPassword, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Email check (instant DB lookup — no OTP needed)
router.post('/check-email', checkEmail);

// OTP flow (registration + forgot password)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Password reset (OTP already verified in request body)
router.post('/reset-password', [
    body('email').isEmail().withMessage('Valid email required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], resetPassword);

// Register
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

// Login
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/me', protect, getMe);
router.post('/verify-identity', protect, submitVerification);
router.put('/change-password', protect, changePassword);

module.exports = router;
