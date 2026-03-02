const express = require('express');
const {
    createRental, getRentals, getRental, updateRentalStatus,
    deliverRental, requestReturn, completeReturn
} = require('../controllers/rentalController');
const { protect, requireVerified } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getRentals);
router.get('/:id', protect, getRental);
router.post('/', protect, requireVerified, createRental);
router.put('/:id/status', protect, updateRentalStatus);
router.post('/:id/deliver', protect, deliverRental);
router.post('/:id/request-return', protect, requestReturn);
router.post('/:id/complete-return', protect, completeReturn);

module.exports = router;
