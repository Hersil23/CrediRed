const express = require('express');
const router = express.Router();
const {
  createClient,
  getMyClients,
  getClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');

router.post('/', protect, checkStatus, createClient);
router.get('/', protect, checkStatus, getMyClients);
router.get('/:id', protect, checkStatus, getClient);
router.put('/:id', protect, checkStatus, updateClient);
router.delete('/:id', protect, checkStatus, deleteClient);

module.exports = router;
