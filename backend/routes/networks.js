const express = require('express');
const router = express.Router();
const {
  createNetwork,
  getMyNetwork,
  getNetworkMembers,
  getNetworkMemberDetail,
  updateLevelNames,
  removeMember
} = require('../controllers/networkController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');
const checkRole = require('../middleware/checkRole');

router.post('/', protect, checkStatus, createNetwork);
router.get('/mine', protect, checkStatus, getMyNetwork);
router.get('/members', protect, checkStatus, getNetworkMembers);
router.get('/members/:id', protect, checkStatus, getNetworkMemberDetail);
router.put('/level-names', protect, checkStatus, checkRole('empresarial'), updateLevelNames);
router.delete('/members/:id', protect, checkStatus, removeMember);

module.exports = router;
