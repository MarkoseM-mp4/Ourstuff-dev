const express = require('express');
const { getConversations, startConversation, getMessages, sendMessage, getUnreadCount, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // all message routes require authentication

router.get('/', getConversations);
router.get('/unread-count', getUnreadCount);
router.post('/start', startConversation);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
