const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateProfile,
  changePassword,
  updateWhatsappTemplates,
  blockUser,
  unblockUser,
  activateSubscription,
  deleteUser
} = require('../controllers/userController');
const protect = require('../middleware/auth');
const checkStatus = require('../middleware/checkStatus');
const checkRole = require('../middleware/checkRole');

// Rutas de perfil (cualquier usuario autenticado)
router.put('/profile', protect, checkStatus, updateProfile);
router.put('/password', protect, checkStatus, changePassword);
router.put('/whatsapp-templates', protect, checkStatus, updateWhatsappTemplates);

// Rutas de superadmin
router.get('/', protect, checkRole('superadmin'), getAllUsers);
router.get('/:id', protect, checkRole('superadmin'), getUser);
router.put('/:id/block', protect, checkRole('superadmin'), blockUser);
router.put('/:id/unblock', protect, checkRole('superadmin'), unblockUser);
router.put('/:id/subscription', protect, checkRole('superadmin'), activateSubscription);
router.delete('/:id', protect, checkRole('superadmin'), deleteUser);

module.exports = router;
