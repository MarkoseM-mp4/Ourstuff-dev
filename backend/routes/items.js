const express = require('express');
const {
    getItems, getItem, createItem, updateItem, deleteItem
} = require('../controllers/itemController');
const { protect, requireVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', protect, requireVerified, upload.array('images', 5), createItem);
router.put('/:id', protect, upload.array('images', 5), updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;