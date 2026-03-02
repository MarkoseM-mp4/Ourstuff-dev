const User = require('../models/User');
const Item = require('../models/Item');
const Rental = require('../models/Rental');
const CommunityRequest = require('../models/CommunityRequest');

// @desc    Get public user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, location, bio, lat, lng } = req.body;
        const avatar = req.file ? req.file.path : undefined;

        const updateData = { name, phone, location, bio };
        if (avatar) updateData.avatar = avatar;
        if (lat && lng) updateData.coordinates = [Number(lng), Number(lat)];

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// @desc    Get dashboard data for logged-in user
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [myListings, myRentals, myRequests, unreadNotifications] = await Promise.all([
            Item.find({ owner: userId }).sort({ createdAt: -1 }).limit(10).lean(),
            Rental.find({ renter: userId })
                .populate('item', 'title images pricePerDay')
                .populate('owner', 'name avatar')
                .sort({ createdAt: -1 })
                .limit(10).lean(),
            CommunityRequest.find({ requester: userId }).sort({ createdAt: -1 }).limit(10).lean(),
            require('../models/Notification').countDocuments({ recipient: userId, isRead: false }),
        ]);

        res.json({
            success: true,
            dashboard: {
                myListings,
                myRentals,
                myRequests,
                unreadNotifications,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getUserProfile, updateProfile, getDashboard };
