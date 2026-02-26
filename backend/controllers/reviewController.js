const Review = require('../models/Review');
const Rental = require('../models/Rental');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a review after a completed rental
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
    try {
        const { rentalId, rating, comment } = req.body;

        const rental = await Rental.findById(rentalId).populate('item', 'title');
        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
        if (rental.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Can only review completed rentals' });
        }

        const isRenter = rental.renter.toString() === req.user._id.toString();
        const isOwner = rental.owner.toString() === req.user._id.toString();

        if (!isRenter && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check if already reviewed
        const existing = await Review.findOne({ rental: rentalId, reviewer: req.user._id });
        if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this rental' });

        // The reviewee is the other party
        const revieweeId = isRenter ? rental.owner : rental.renter;

        const review = await Review.create({
            rental: rentalId,
            reviewer: req.user._id,
            reviewee: revieweeId,
            item: rental.item._id,
            rating,
            comment: comment || '',
        });

        // Update item rating
        const itemReviews = await Review.find({ item: rental.item._id });
        const avgRating = itemReviews.reduce((a, r) => a + r.rating, 0) / itemReviews.length;
        await Item.findByIdAndUpdate(rental.item._id, {
            rating: avgRating.toFixed(1),
            reviewCount: itemReviews.length,
        });

        // Update user rating
        const userReviews = await Review.find({ reviewee: revieweeId });
        const userAvg = userReviews.reduce((a, r) => a + r.rating, 0) / userReviews.length;
        await User.findByIdAndUpdate(revieweeId, {
            rating: userAvg.toFixed(1),
            reviewCount: userReviews.length,
        });

        // Notify reviewee
        await Notification.create({
            recipient: revieweeId,
            type: 'review_received',
            message: `${req.user.name} left you a ${rating}-star review.`,
            item: rental.item._id,
        });

        // Mark reviewed flag on rental
        if (isRenter) rental.reviewedByRenter = true;
        if (isOwner) rental.reviewedByOwner = true;
        await rental.save();

        res.status(201).json({ success: true, review });
    } catch (err) {
        next(err);
    }
};

// @desc    Get reviews for an item
// @route   GET /api/reviews/item/:itemId
// @access  Public
const getItemReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ item: req.params.itemId })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (err) {
        next(err);
    }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'name avatar')
            .populate('item', 'title images')
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (err) {
        next(err);
    }
};

module.exports = { createReview, getItemReviews, getUserReviews };
