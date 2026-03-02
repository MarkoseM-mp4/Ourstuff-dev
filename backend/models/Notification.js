const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: [
            'rental_request',    // Someone wants to rent your item
            'rental_accepted',   // Owner accepted your rental
            'rental_rejected',   // Owner rejected your rental
            'rental_active',     // Item was delivered, rental is active
            'return_otp',        // OTP generated for item return
            'rental_completed',  // Rental marked complete (owner to renter)
            'rental_completed_renter', // Rental marked complete (renter to owner)
            'rental_cancelled',  // Rental cancelled
            'community_respond', // Someone responded to your community request
            'review_received',   // You got a new review
            'item_listed',       // Confirmation of item listed
        ],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    // Optional link references
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', default: null },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    communityRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityRequest', default: null },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
