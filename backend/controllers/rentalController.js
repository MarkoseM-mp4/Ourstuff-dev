const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

// @desc    Create a rental request
// @route   POST /api/rentals
// @access  Private + Verified
const createRental = async (req, res, next) => {
    try {
        const { itemId, fromDate, toDate, message } = req.body;

        const item = await Item.findById(itemId).populate('owner', 'name');
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (!item.isAvailable) return res.status(400).json({ success: false, message: 'Item is not available' });
        if (item.owner._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot rent your own item' });
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (from >= to) return res.status(400).json({ success: false, message: 'Invalid date range' });

        const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        const totalPrice = totalDays * item.pricePerDay;

        const rental = await Rental.create({
            item: item._id,
            renter: req.user._id,
            owner: item.owner._id,
            fromDate: from,
            toDate: to,
            totalDays,
            totalPrice,
            deposit: item.deposit,
            message: message || '',
        });

        // Notify the owner
        await Notification.create({
            recipient: item.owner._id,
            type: 'rental_request',
            message: `${req.user.name} wants to rent your item "${item.title}" for ${totalDays} day(s).`,
            rental: rental._id,
            item: item._id,
        });

        res.status(201).json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

// @desc    Get rentals for logged-in user (as renter or owner)
// @route   GET /api/rentals
// @access  Private
const getRentals = async (req, res, next) => {
    try {
        const { role } = req.query; // 'renter' or 'owner'
        const query = role === 'owner' ? { owner: req.user._id } : { renter: req.user._id };

        const rentals = await Rental.find(query)
            .populate('item', 'title images pricePerDay location')
            .populate('renter', 'name avatar')
            .populate('owner', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, rentals });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single rental
// @route   GET /api/rentals/:id
// @access  Private
const getRental = async (req, res, next) => {
    try {
        const rental = await Rental.findById(req.params.id)
            .populate('item')
            .populate('renter', 'name avatar email phone')
            .populate('owner', 'name avatar email phone');

        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });

        const isParty =
            rental.renter._id.toString() === req.user._id.toString() ||
            rental.owner._id.toString() === req.user._id.toString();

        if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

        res.json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

// @desc    Update rental status (accept/reject/complete/cancel)
// @route   PUT /api/rentals/:id/status
// @access  Private
const updateRentalStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const rental = await Rental.findById(req.params.id).populate('item', 'title');

        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });

        const isOwner = rental.owner.toString() === req.user._id.toString();
        const isRenter = rental.renter.toString() === req.user._id.toString();

        // Ownership checks
        if (['accepted', 'rejected'].includes(status) && !isOwner) {
            return res.status(403).json({ success: false, message: 'Only the owner can accept or reject' });
        }
        if (status === 'cancelled' && !isRenter) {
            return res.status(403).json({ success: false, message: 'Only the renter can cancel' });
        }
        if (status === 'completed' && !isOwner) {
            return res.status(403).json({ success: false, message: 'Only the owner can mark as complete' });
        }

        rental.status = status;
        await rental.save();

        // Block item dates on accept
        if (status === 'accepted') {
            await Item.findByIdAndUpdate(rental.item._id, {
                $push: { bookedDates: { from: rental.fromDate, to: rental.toDate } },
            });
            await Notification.create({
                recipient: rental.renter,
                type: 'rental_accepted',
                message: `Your rental request for "${rental.item.title}" was accepted!`,
                rental: rental._id,
                item: rental.item._id,
            });
        }

        if (status === 'rejected') {
            await Notification.create({
                recipient: rental.renter,
                type: 'rental_rejected',
                message: `Your rental request for "${rental.item.title}" was declined.`,
                rental: rental._id,
                item: rental.item._id,
            });
        }

        if (status === 'completed') {
            await Notification.create({
                recipient: rental.renter,
                type: 'rental_completed',
                message: `Your rental of "${rental.item.title}" has been marked as complete. Please leave a review!`,
                rental: rental._id,
                item: rental.item._id,
            });
        }

        res.json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

module.exports = { createRental, getRentals, getRental, updateRentalStatus };
