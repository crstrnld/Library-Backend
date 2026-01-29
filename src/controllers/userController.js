const { User } = require('../models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User. findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const userId = req.user.userId;

    // Check if user is updating their own profile or is admin
    if (parseInt(id) !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Handle profile image upload
    if (req.file) {
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHANGE PASSWORD 
// ==========================================
exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userId = req.user. userId;

    console.log('🔐 Change password request: ');
    console.log('  User ID from token:', userId);
    console.log('  Target user ID:', id);
    console.log('  User role:', req.user.role);

    // Check if user is updating their own password or is admin
    if (id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own password',
      });
    }

    // Validation
    if (!currentPassword || ! newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res. status(404).json({
        success: false,
        message:  'User not found',
      });
    }

    console.log('✅ User found:', user.email);

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    console.log('🔓 Current password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (hooks akan handle bcrypt)
    console.log('🔐 Hashing new password...');
    user.password = newPassword;
    await user.save();

    console.log('✅ Password updated successfully');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Error in changePassword:', error);
    next(error);
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req. params;
    const { role } = req.body;

    if (!['member', 'librarian', 'admin'].includes(role)) {
      return res. status(400).json({
        success: false,
        message:  'Invalid role',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated',
      data: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { id: user.id, email: user.email, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '../../uploads/profiles', path. basename(user.profileImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });

    const usersByRole = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole:  usersByRole. reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }

};
