const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Power Tools',
            'Garden',
            'Camping',
            'Electronics',
            'Sports',
            'Kitchen',
            'Music',
            'Furniture',
            'Cleaning',
            'Other',
        ],
    },
    pricePerDay: {
        type: Number,
        required: [true, 'Price per day is required'],
        min: 0,
    },
    deposit: {
        type: Number,
        default: 0,
    },
    images: [{ type: String }],

    // Human-readable location name (e.g. "Kottayam")
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },

    // GeoJSON Point — required for $nearSphere radius searches
    geoLocation: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        },
    },

    isAvailable: {
        type: Boolean,
        default: true,
    },
    // Booked date ranges
    bookedDates: [
        {
            from: { type: Date },
            to: { type: Date },
        },
    ],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Full-text search index on title and description
itemSchema.index({ title: 'text', description: 'text' });

// 2dsphere index on the GeoJSON field — mandatory for proximity searches
itemSchema.index({ geoLocation: '2dsphere' });

itemSchema.index({ owner: 1, createdAt: -1 });
itemSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('Item', itemSchema);
