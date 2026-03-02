const Item = require('../models/Item');
const Notification = require('../models/Notification');

// @desc    Get all items (with search/filter)
// @route   GET /api/items
// @access  Public
const getItems = async (req, res, next) => {
    try {
        const { search, category, minPrice, maxPrice, location, lat, lng, radius, page = 1, limit = 12 } = req.query;

        const query = { isAvailable: true };

        if (search) {
            query.$text = { $search: search };
        }
        if (category) query.category = category;

        // When doing a geospatial radius search, skip the text location filter
        // (the $nearSphere already covers proximity)
        if (location && !(lat && lng && radius)) {
            query.location = new RegExp(location, 'i');
        }

        if (minPrice || maxPrice) {
            query.pricePerDay = {};
            if (minPrice) query.pricePerDay.$gte = Number(minPrice);
            if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
        }

        const isGeoSearch = lat && lng && radius;

        // --- Geospatial radius search ---
        // Using $nearSphere with proper GeoJSON Point.
        // $nearSphere does NOT conflict with .sort() the same way $near does,
        // but still sorts results nearest-first automatically.
        if (isGeoSearch) {
            query.geoLocation = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)],
                    },
                    $maxDistance: Number(radius) * 1000, // km → metres
                },
            };
        }

        const skip = (Number(page) - 1) * Number(limit);

        let mongoQuery = Item.find(query)
            .populate('owner', 'name avatar isVerified location')
            .skip(skip)
            .limit(Number(limit));

        // $nearSphere auto-sorts nearest-first; only add createdAt sort for non-geo queries
        if (!isGeoSearch) {
            mongoQuery = mongoQuery.sort({ createdAt: -1 });
        }

        const items = await mongoQuery.lean();

        // Count without the geo-operator (which can't be used in countDocuments alongside $nearSphere on Atlas)
        const countQuery = { isAvailable: true };
        if (query.category) countQuery.category = query.category;
        if (query.location) countQuery.location = query.location;
        if (query.pricePerDay) countQuery.pricePerDay = query.pricePerDay;
        if (query.$text) countQuery.$text = query.$text;

        const total = await Item.countDocuments(countQuery);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            items,
        });
    } catch (err) {
        console.error('getItems error:', err.message);
        next(err);
    }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
const getItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('owner', 'name avatar isVerified location rating reviewCount createdAt');
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, item });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new item listing
// @route   POST /api/items
// @access  Private + Verified
const createItem = async (req, res, next) => {
    try {
        const { title, description, category, pricePerDay, deposit, location, lat, lng } = req.body;
        const images = req.files ? req.files.map((f) => f.path) : [];

        const newItemData = {
            owner: req.user._id,
            title,
            description,
            category,
            pricePerDay,
            deposit: deposit || 0,
            location,
            images,
        };

        // Store as proper GeoJSON Point if coordinates are provided
        if (lat && lng) {
            newItemData.geoLocation = {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)],
            };
        }

        const item = await Item.create(newItemData);

        // Notify owner of successful listing
        await Notification.create({
            recipient: req.user._id,
            type: 'item_listed',
            message: `Your item "${item.title}" has been listed successfully.`,
            item: item._id,
        });

        // Update user listing count
        await require('../models/User').findByIdAndUpdate(req.user._id, { $inc: { totalListings: 1 } });

        res.status(201).json({ success: true, item });
    } catch (err) {
        next(err);
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private (owner only)
const updateItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (item.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { title, description, category, pricePerDay, deposit, location, isAvailable, lat, lng } = req.body;
        const newImages = req.files ? req.files.map((f) => f.path) : [];

        item.title = title ?? item.title;
        item.description = description ?? item.description;
        item.category = category ?? item.category;
        item.pricePerDay = pricePerDay ?? item.pricePerDay;
        item.deposit = deposit ?? item.deposit;
        item.location = location ?? item.location;
        item.isAvailable = isAvailable ?? item.isAvailable;
        if (newImages.length > 0) item.images = newImages;

        // Update GeoJSON location if new coordinates are provided
        if (lat && lng) {
            item.geoLocation = {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)],
            };
        }

        await item.save();
        res.json({ success: true, item });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private (owner only)
const deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (item.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await item.deleteOne();
        await require('../models/User').findByIdAndUpdate(req.user._id, { $inc: { totalListings: -1 } });

        res.json({ success: true, message: 'Item removed' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
