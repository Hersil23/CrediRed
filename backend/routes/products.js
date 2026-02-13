const express = require('express');
const router = express.Router();
const {
  createProduct,
  getMyProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  assignProduct
} = require('../controllers/productController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');

router.post('/', protect, checkStatus, createProduct);
router.get('/', protect, checkStatus, getMyProducts);
router.get('/:id', protect, checkStatus, getProduct);
router.put('/:id', protect, checkStatus, updateProduct);
router.delete('/:id', protect, checkStatus, deleteProduct);
router.post('/:id/assign', protect, checkStatus, assignProduct);

module.exports = router;
