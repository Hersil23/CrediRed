const express = require('express');
const router = express.Router();
const {
  createSale,
  getMySales,
  getSale,
  getPendingCollections
} = require('../controllers/saleController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');

router.post('/', protect, checkStatus, createSale);
router.get('/', protect, checkStatus, getMySales);
router.get('/collections', protect, checkStatus, getPendingCollections);
router.get('/:id', protect, checkStatus, getSale);

module.exports = router;
