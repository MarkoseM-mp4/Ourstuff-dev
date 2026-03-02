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
        // Allow same-day (1-day rental); reject only if end is before start
        if (to < from) return res.status(400).json({ success: false, message: 'End date cannot be before start date' });

        // Date conflict check
        const isConflict = item.bookedDates.some(range => {
            const bookedFrom = new Date(range.from);
            const bookedTo = new Date(range.to);
            // Overlap condition: ranges overlap if start <= booked end AND end >= booked start
            return (from <= bookedTo && to >= bookedFrom);
        });

        if (isConflict) {
            return res.status(400).json({ success: false, message: 'Item is already booked during these dates' });
        }

        // Same-day rental = 1 day; otherwise count inclusive days
        const totalDays = from.getTime() === to.getTime()
            ? 1
            : Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
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
            .sort({ createdAt: -1 }).lean();

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

        const originalStatus = rental.status;
        rental.status = status;
        await rental.save();

        // Block item dates on accept
        if (status === 'accepted') {
            rental.deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await Item.findByIdAndUpdate(rental.item._id, {
                $push: { bookedDates: { from: rental.fromDate, to: rental.toDate } },
            });
            await Notification.create({
                recipient: rental.renter,
                type: 'rental_accepted',
                message: `Your rental request for "${rental.item.title}" was accepted! Your delivery OTP is ${rental.deliveryOtp}. Give this to the owner when you receive the item.`,
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

        if (status === 'cancelled') {
            if (originalStatus === 'accepted') {
                await Item.findByIdAndUpdate(rental.item._id, {
                    $pull: { bookedDates: { from: rental.fromDate, to: rental.toDate } },
                });
            }
            await Notification.create({
                recipient: rental.owner,
                type: 'rental_cancelled',
                message: `${req.user.name} cancelled their rental request for "${rental.item.title}".`,
                rental: rental._id,
                item: rental.item._id,
            });
        }

        res.json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

// @desc    Seller confirms delivery via OTP
// @route   POST /api/rentals/:id/deliver
// @access  Private
const deliverRental = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const rental = await Rental.findById(req.params.id).populate('item', 'title');

        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
        if (rental.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the owner can mark as delivered' });
        }
        if (rental.status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Rental must be accepted first' });
        }
        if (rental.deliveryOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        rental.status = 'active';
        rental.deliveredAt = Date.now();
        await rental.save();

        await Notification.create({
            recipient: rental.renter,
            type: 'rental_active',
            message: `You have successfully received "${rental.item.title}". The rental is now active.`,
            rental: rental._id,
            item: rental.item._id,
        });

        res.json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

// @desc    Renter initiates return (generates return OTP for seller)
// @route   POST /api/rentals/:id/request-return
// @access  Private
const requestReturn = async (req, res, next) => {
    try {
        const rental = await Rental.findById(req.params.id).populate('item', 'title');

        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
        if (rental.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the renter can request a return' });
        }
        if (rental.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Rental must be active to return' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        rental.returnOtp = otp;
        await rental.save();

        await Notification.create({
            recipient: rental.owner,
            type: 'return_otp',
            message: `The renter is returning "${rental.item.title}". Your return OTP is: ${otp}. Provide this to the renter to confirm the return.`,
            rental: rental._id,
            item: rental.item._id,
        });

        res.json({ success: true, message: 'Return OTP sent to owner. Please ask them for it.' });
    } catch (err) {
        next(err);
    }
};

// @desc    Renter confirms return via OTP from seller
// @route   POST /api/rentals/:id/complete-return
// @access  Private
const completeReturn = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const rental = await Rental.findById(req.params.id).populate('item', 'title');

        if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
        if (rental.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the renter can complete the return' });
        }
        if (rental.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Rental must be active to return' });
        }
        if (!rental.returnOtp || rental.returnOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        rental.status = 'completed';
        await rental.save();

        await Notification.create({
            recipient: rental.owner,
            type: 'rental_completed',
            message: `Your item "${rental.item.title}" has been successfully returned and the rental is complete. Please leave a review!`,
            rental: rental._id,
            item: rental.item._id,
        });

        await Notification.create({
            recipient: rental.renter,
            type: 'rental_completed_renter',
            message: `You have successfully returned "${rental.item.title}". Please leave a review for the item!`,
            rental: rental._id,
            item: rental.item._id,
        });

        res.json({ success: true, rental });
    } catch (err) {
        next(err);
    }
};

module.exports = { createRental, getRentals, getRental, updateRentalStatus, deliverRental, requestReturn, completeReturn };
