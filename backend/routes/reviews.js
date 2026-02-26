const express = require('express');
const { createReview, getItemReviews, getUserReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/item/:itemId', getItemReviews);
router.get('/user/:userId', getUserReviews);

module.exports = router;
