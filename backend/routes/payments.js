const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentsBySale,
  getMyPayments
} = require('../controllers/paymentController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');

router.post('/', protect, checkStatus, createPayment);
router.get('/', protect, checkStatus, getMyPayments);
router.get('/sale/:saleId', protect, checkStatus, getPaymentsBySale);

module.exports = router;
