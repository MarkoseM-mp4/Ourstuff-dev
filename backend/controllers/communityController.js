const CommunityRequest = require('../models/CommunityRequest');
const Notification = require('../models/Notification');

// @desc    Get a single community request by ID
// @route   GET /api/community/:id
// @access  Public
const getCommunityRequest = async (req, res, next) => {
    try {
        const request = await CommunityRequest.findById(req.params.id)
            .populate('requester', 'name avatar isVerified location')
            .populate('responses.responder', 'name avatar isVerified');
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, request });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all open community requests
// @route   GET /api/community
// @access  Public
const getCommunityRequests = async (req, res, next) => {
    try {
        const { category, location, lat, lng, radius, page = 1, limit = 12 } = req.query;
        const query = { status: 'open' };

        if (category) query.category = category;
        if (location) query.location = new RegExp(location, 'i');

        if (lat && lng && radius) {
            query.coordinates = {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: Number(radius) * 1000
                }
            };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [requests, total] = await Promise.all([
            CommunityRequest.find(query)
                .populate('requester', 'name avatar isVerified location')
                .sort({ isUrgent: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            CommunityRequest.countDocuments(query),
        ]);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            requests,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a community request
// @route   POST /api/community
// @access  Private
const createCommunityRequest = async (req, res, next) => {
    try {
        const { itemName, description, category, budget, location, fromDate, toDate, isUrgent, lat, lng } = req.body;

        const requestData = {
            requester: req.user._id,
            itemName,
            description,
            category: category || 'Other',
            budget,
            location,
            fromDate,
            toDate,
            isUrgent: isUrgent || false,
        };

        if (lat && lng) {
            requestData.coordinates = [Number(lng), Number(lat)];
        }

        const request = await CommunityRequest.create(requestData);

        res.status(201).json({ success: true, request });
    } catch (err) {
        next(err);
    }
};

// @desc    Respond to a community request
// @route   POST /api/community/:id/respond
// @access  Private + Verified
const respondToCommunityRequest = async (req, res, next) => {
    try {
        const { message, itemId } = req.body;

        const request = await CommunityRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        if (request.status === 'closed') {
            return res.status(400).json({ success: false, message: 'This request is already closed' });
        }

        request.responses.push({
            responder: req.user._id,
            message,
            item: itemId || null,
        });
        request.status = 'responded';
        await request.save();

        // Notify the requester
        await Notification.create({
            recipient: request.requester,
            type: 'community_respond',
            message: `${req.user.name} responded to your request for "${request.itemName}".`,
            communityRequest: request._id,
        });

        res.json({ success: true, request });
    } catch (err) {
        next(err);
    }
};

// @desc    Close / delete own community request
// @route   DELETE /api/community/:id
// @access  Private
const deleteCommunityRequest = async (req, res, next) => {
    try {
        const request = await CommunityRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        if (request.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await request.deleteOne();
        res.json({ success: true, message: 'Request removed' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCommunityRequest,
    getCommunityRequests,
    createCommunityRequest,
    respondToCommunityRequest,
    deleteCommunityRequest,
};
