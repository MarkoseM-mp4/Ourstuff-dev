const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    // Optional context references
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    communityRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityRequest', default: null },
    // Quick display
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    context: { type: String, enum: ['item', 'community', 'direct'], default: 'direct' },
}, { timestamps: true });

// Ensure we don't create duplicate conversations between the same two people about the same thing
conversationSchema.index({ participants: 1, item: 1 });
conversationSchema.index({ participants: 1, communityRequest: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
