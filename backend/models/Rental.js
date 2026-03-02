const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    renter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fromDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    toDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    totalDays: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    deposit: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'active', 'completed', 'cancelled'],
        default: 'pending',
    },
    message: {
        type: String,
        default: '',
    },
    deliveryOtp: {
        type: String,
    },
    returnOtp: {
        type: String,
    },
    deliveredAt: {
        type: Date,
    },
    reviewedByRenter: { type: Boolean, default: false },
    reviewedByOwner: { type: Boolean, default: false },
}, {
    timestamps: true,
});

rentalSchema.index({ owner: 1, createdAt: -1 });
rentalSchema.index({ renter: 1, createdAt: -1 });
rentalSchema.index({ status: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
