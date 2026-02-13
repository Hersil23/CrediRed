const express = require('express');
const router = express.Router();
const {
  getMyDashboard,
  getNetworkDashboard,
  getSuperadminDashboard
} = require('../controllers/dashboardController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');
const checkRole = require('../middleware/checkRole');

router.get('/', protect, checkStatus, getMyDashboard);
router.get('/network', protect, checkStatus, getNetworkDashboard);
router.get('/admin', protect, checkRole('superadmin'), getSuperadminDashboard);

module.exports = router;
