const mongoose = require('mongoose');

const communityRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        enum: [
            'Power Tools', 'Garden', 'Camping',
            'Electronics', 'Sports', 'Kitchen',
            'Music', 'Furniture', 'Cleaning', 'Other',
        ],
        default: 'Other',
    },
    budget: {
        type: Number,
        required: [true, 'Budget per day is required'],
        min: 0,
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    fromDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    toDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    isUrgent: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['open', 'responded', 'closed'],
        default: 'open',
    },
    responses: [
        {
            responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            message: { type: String },
            item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
            createdAt: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model('CommunityRequest', communityRequestSchema);
