const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rental',
        required: true,
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The user being reviewed (owner or renter)
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
        default: '',
    },
}, {
    timestamps: true,
});

// One review per rental per reviewer
reviewSchema.index({ rental: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
