const express = require('express');
const { body } = require('express-validator');
const { sendOtp, verifyOtp, register, login, getMe, submitVerification } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// OTP flow
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

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

module.exports = router;
