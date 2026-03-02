const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    // MongoDB TTL index — document is automatically deleted after 10 minutes
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 min
        expires: 0, // delete when Date.now() >= expiresAt
    },
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
