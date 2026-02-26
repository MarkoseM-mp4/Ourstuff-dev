const Item = require('../models/Item');
const Notification = require('../models/Notification');

// @desc    Get all items (with search/filter)
// @route   GET /api/items
// @access  Public
const getItems = async (req, res, next) => {
    try {
        const { search, category, minPrice, maxPrice, location, page = 1, limit = 12 } = req.query;

        const query = { isAvailable: true };

        if (search) {
            query.$text = { $search: search };
        }
        if (category) query.category = category;
        if (location) query.location = new RegExp(location, 'i');
        if (minPrice || maxPrice) {
            query.pricePerDay = {};
            if (minPrice) query.pricePerDay.$gte = Number(minPrice);
            if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Item.find(query)
                .populate('owner', 'name avatar isVerified location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Item.countDocuments(query),
        ]);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            items,
        });
    } catch (err) {
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
        const { title, description, category, pricePerDay, deposit, location } = req.body;
        const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

        const item = await Item.create({
            owner: req.user._id,
            title,
            description,
            category,
            pricePerDay,
            deposit: deposit || 0,
            location,
            images,
        });

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

        const { title, description, category, pricePerDay, deposit, location, isAvailable } = req.body;
        const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

        item.title = title ?? item.title;
        item.description = description ?? item.description;
        item.category = category ?? item.category;
        item.pricePerDay = pricePerDay ?? item.pricePerDay;
        item.deposit = deposit ?? item.deposit;
        item.location = location ?? item.location;
        item.isAvailable = isAvailable ?? item.isAvailable;
        if (newImages.length > 0) item.images = newImages;

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
