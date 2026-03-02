const express = require('express');
const {
    getCommunityRequests, getCommunityRequest, createCommunityRequest,
    respondToCommunityRequest, deleteCommunityRequest
} = require('../controllers/communityController');
const { protect, requireVerified } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getCommunityRequests);
router.post('/', protect, createCommunityRequest);
router.get('/:id', getCommunityRequest);
router.post('/:id/respond', protect, requireVerified, respondToCommunityRequest);
router.delete('/:id', protect, deleteCommunityRequest);

module.exports = router;
