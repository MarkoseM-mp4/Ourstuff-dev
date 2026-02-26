const express = require('express');
const {
    createRental, getRentals, getRental, updateRentalStatus
} = require('../controllers/rentalController');
const { protect, requireVerified } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getRentals);
router.get('/:id', protect, getRental);
router.post('/', protect, requireVerified, createRental);
router.put('/:id/status', protect, updateRentalStatus);

module.exports = router;
