const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const roleCheckMiddleware = require('../middlewares/roleCheck');
const { uploadProfiles } = require('../config/multer');

const router = express.Router();

// Get all users (admin only)
router.get(
  '/',
  authMiddleware,
  roleCheckMiddleware(['admin']),
  userController.getAllUsers
);

// Get user by ID
router.get('/:id', authMiddleware, userController.getUserById);

// ==========================================
// UPDATE USER PROFILE (dengan upload foto)
// ==========================================
router.put(
  '/:id',
  authMiddleware,
  uploadProfiles.single('profileImage'),
  userController.updateUserProfile
);

// ==========================================
// CHANGE PASSWORD
// ==========================================
router.post('/:id/change-password', authMiddleware, userController.changePassword);

// Update user role (admin only)
router.put(
  '/:id/role',
  authMiddleware,
  roleCheckMiddleware(['admin']),
  userController.updateUserRole
);

// Toggle user status (admin only)
router.patch(
  '/:id/status',
  authMiddleware,
  roleCheckMiddleware(['admin']),
  userController.toggleUserStatus
);

// Delete user (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleCheckMiddleware(['admin']),
  userController.deleteUser
);

// Get user statistics (admin only)
router.get(
  '/statistics/all',
  authMiddleware,
  roleCheckMiddleware(['admin']),
  userController.getUserStatistics
);

module.exports = router;