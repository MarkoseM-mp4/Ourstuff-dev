const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/emailService');

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @desc    Send OTP to email (real email via Gmail SMTP)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email.toLowerCase()] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

        // Send real email
        await sendOtpEmail(email, otp);

        res.json({ success: true, message: `Verification code sent to ${email}` });
    } catch (err) {
        // If email fails (e.g. credentials not configured), surface a helpful message
        console.error('❌ Email send failed:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email. Please check EMAIL_USER and EMAIL_PASS in .env',
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const key = email?.toLowerCase();
        const record = otpStore[key];

        if (!record) return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        if (Date.now() > record.expiresAt) {
            delete otpStore[key];
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });

        delete otpStore[key]; // one-time use
        const userExists = await User.findOne({ email: key });
        res.json({ success: true, message: 'OTP verified.', isExistingUser: !!userExists });
    } catch (err) {
        next(err);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, phone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password, phone: phone || '' });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// @desc    Submit identity verification (mock — auto-approves for demo)
// @route   POST /api/auth/verify-identity
// @access  Private
const submitVerification = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        // Mock: instantly approve — in production this would call Persona/Sumsub
        user.isVerified = true;
        user.verificationStatus = 'verified';
        await user.save();

        res.json({
            success: true,
            message: 'Identity verified successfully.',
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { sendOtp, verifyOtp, register, login, getMe, submitVerification };
