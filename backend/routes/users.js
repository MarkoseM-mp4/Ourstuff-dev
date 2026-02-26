const express = require('express');
const { getUserProfile, updateProfile, getDashboard } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;
