const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages
// @access  Private
const getConversations = async (req, res, next) => {
    try {
        const conversations = await Conversation.find({ participants: req.user._id })
            .populate('participants', 'name avatar isVerified')
            .populate('item', 'title images location')
            .populate('communityRequest', 'itemName')
            .sort({ lastMessageAt: -1 });

        // Attach unread count for each conversation
        const withUnread = await Promise.all(conversations.map(async (conv) => {
            const unread = await Message.countDocuments({
                conversation: conv._id,
                sender: { $ne: req.user._id },
                isRead: false,
            });
            return { ...conv.toObject(), unreadCount: unread };
        }));

        res.json({ success: true, conversations: withUnread });
    } catch (err) {
        next(err);
    }
};

// @desc    Start or find an existing conversation
// @route   POST /api/messages/start
// @access  Private
const startConversation = async (req, res, next) => {
    try {
        const { withUserId, itemId, communityRequestId } = req.body;
        const me = req.user._id;

        if (withUserId === me.toString()) {
            return res.status(400).json({ success: false, message: "You can't message yourself." });
        }

        // Build search query — find an existing conversation between these two participants
        // about the same context (item or request)
        let searchQuery = {
            participants: { $all: [me, withUserId] },
        };
        if (itemId) searchQuery.item = itemId;
        else if (communityRequestId) searchQuery.communityRequest = communityRequestId;
        else {
            searchQuery.item = null;
            searchQuery.communityRequest = null;
        }

        let conversation = await Conversation.findOne(searchQuery)
            .populate('participants', 'name avatar isVerified')
            .populate('item', 'title images location')
            .populate('communityRequest', 'itemName');

        if (!conversation) {
            const context = itemId ? 'item' : communityRequestId ? 'community' : 'direct';
            conversation = await Conversation.create({
                participants: [me, withUserId],
                item: itemId || null,
                communityRequest: communityRequestId || null,
                context,
            });
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'name avatar isVerified')
                .populate('item', 'title images location')
                .populate('communityRequest', 'itemName');
        }

        res.json({ success: true, conversation });
    } catch (err) {
        next(err);
    }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
    try {
        const conv = await Conversation.findById(req.params.conversationId);
        if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

        // Must be a participant
        if (!conv.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const messages = await Message.find({ conversation: conv._id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 })
            .limit(200);

        // Mark unread messages from the other person as read
        await Message.updateMany(
            { conversation: conv._id, sender: { $ne: req.user._id }, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, messages });
    } catch (err) {
        next(err);
    }
};

// @desc    Send a message
// @route   POST /api/messages/:conversationId
// @access  Private
const sendMessage = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        const conv = await Conversation.findById(req.params.conversationId);
        if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

        if (!conv.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const message = await Message.create({
            conversation: conv._id,
            sender: req.user._id,
            text: text.trim(),
        });

        // Update conversation preview
        await Conversation.findByIdAndUpdate(conv._id, {
            lastMessage: text.trim().substring(0, 80),
            lastMessageAt: new Date(),
        });

        const populated = await Message.findById(message._id).populate('sender', 'name avatar');

        res.status(201).json({ success: true, message: populated });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
        }

        await message.deleteOne();

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

// @desc    Count total unread messages across all conversations
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
    try {
        const convIds = (await Conversation.find({ participants: req.user._id }, '_id')).map(c => c._id);
        const count = await Message.countDocuments({
            conversation: { $in: convIds },
            sender: { $ne: req.user._id },
            isRead: false,
        });
        res.json({ success: true, count });
    } catch (err) {
        next(err);
    }
};

module.exports = { getConversations, startConversation, getMessages, sendMessage, getUnreadCount, deleteMessage };
