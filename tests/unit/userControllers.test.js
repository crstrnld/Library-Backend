const { User } = require('../../src/models');
const userController = require('../../src/controllers/userController');

describe('User Controller', () => {
  describe('getAllUsers', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      await User.create({
        name: 'Librarian User',
        email:  'librarian@example.com',
        password: 'password123',
        role: 'librarian',
      });

      await User.create({
        name: 'Member User',
        email: 'member@example. com',
        password: 'password123',
        role: 'member',
      });
    });

    it('should return all users with pagination', async () => {
      const req = {
        query: { page: 1, limit: 10 },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should filter users by role', async () => {
      const req = {
        query: { role: 'admin', page: 1, limit: 10 },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ role: 'admin' }),
          ]),
        })
      );
    });

    it('should search users by name or email', async () => {
      const req = {
        query:  { search: 'librarian', page: 1, limit: 10 },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should not include password in response', async () => {
      const req = {
        query: { page: 1, limit: 10 },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getAllUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect. objectContaining({
          success:  true,
          data: expect. arrayContaining([
            expect.not.objectContaining({
              password: expect.anything(),
            }),
          ]),
        })
      );
    });
  });

  describe('getUserById', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      userId = user.id;
    });

    it('should return user by ID when requested by self', async () => {
      const req = {
        params: { id: userId },
        user: { userId, role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: userId }),
        })
      );
    });

    it('should return user by ID when requested by admin', async () => {
      const req = {
        params: { id:  userId },
        user: { userId:  'admin-id', role: 'admin' },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getUserById(req, res, next);

      expect(res. status).toHaveBeenCalledWith(200);
    });

    it('should return 403 when non-admin user requests other user', async () => {
      const req = {
        params: { id: userId },
        user: { userId: 'other-id', role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
        user: { userId: 'admin-id', role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserProfile', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      userId = user.id;
    });

    it('should update user profile when requested by self', async () => {
      const req = {
        params: { id: userId },
        body: { name: 'Updated Name' },
        user: { userId, role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest. fn(),
      };

      const next = jest.fn();

      await userController.updateUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile updated successfully',
          data: expect.objectContaining({ name: 'Updated Name' }),
        })
      );
    });

    it('should not allow duplicate email', async () => {
      await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123',
      });

      const req = {
        params: { id: userId },
        body: { email: 'another@example.com' },
        user: { userId, role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest. fn();

      await userController. updateUserProfile(req, res, next);

      expect(res. status).toHaveBeenCalledWith(409);
    });

    it('should return 403 for non-admin updating other user', async () => {
      const req = {
        params: { id: userId },
        body: { name: 'Updated Name' },
        user: { userId: 'other-id', role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest. fn(),
      };

      const next = jest.fn();

      await userController.updateUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('changePassword', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example. com',
        password: 'password123',
      });
      userId = user.id;
    });

    it('should change password successfully', async () => {
      const req = {
        params: { id: userId },
        body:  {
          currentPassword: 'password123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        },
        user: { userId, role: 'member' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );
    });

    it('should return 401 for incorrect current password', async () => {
      const req = {
        params: { id: userId },
        body: {
          currentPassword:  'wrongpassword',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        },
        user: { userId, role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when passwords do not match', async () => {
      const req = {
        params: { id: userId },
        body: {
          currentPassword:  'password123',
          newPassword: 'newpassword456',
          confirmPassword: 'differentpassword',
        },
        user: { userId, role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest. fn(),
      };

      const next = jest.fn();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'New password and confirm password do not match',
        })
      );
    });

    it('should return 403 for non-admin changing other user password', async () => {
      const req = {
        params: { id: userId },
        body:  {
          currentPassword: 'password123',
          newPassword:  'newpassword456',
          confirmPassword: 'newpassword456',
        },
        user: { userId: 'other-id', role: 'member' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateUserRole', () => {
    let userId;
    let adminId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      userId = user. id;
      adminId = admin.id;
    });

    it('should update user role to librarian', async () => {
      const req = {
        params: { id: userId },
        body: { role: 'librarian' },
        user: { userId:  adminId, role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ role: 'librarian' }),
        })
      );
    });

    it('should return 400 for invalid role', async () => {
      const req = {
        params: { id: userId },
        body: { role: 'superadmin' },
        user:  { userId: adminId, role:  'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('toggleUserStatus', () => {
    let userId;
    let adminId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isActive: true,
      });

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      userId = user.id;
      adminId = admin. id;
    });

    it('should deactivate user', async () => {
      const req = {
        params: { id: userId },
        user: { userId: adminId, role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.toggleUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect. objectContaining({
          success:  true,
          data: expect.objectContaining({ isActive: false }),
        })
      );
    });

    it('should activate user', async () => {
      // First deactivate
      await User.update({ isActive: false }, { where: { id: userId } });

      const req = {
        params: { id: userId },
        user: { userId: adminId, role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.toggleUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
        user: { userId: adminId, role: 'admin' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.toggleUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    let userId;
    let adminId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      userId = user.id;
      adminId = admin.id;
    });

    it('should delete user (soft delete)', async () => {
      const req = {
        params:  { id: userId },
        user: { userId: adminId, role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const deletedUser = await User.findByPk(userId);
      expect(deletedUser. isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
        user: { userId: adminId, role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getUserStatistics', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Admin 1',
        email: 'admin1@example.com',
        password: 'password123',
        role: 'admin',
      });

      await User. create({
        name: 'Admin 2',
        email:  'admin2@example.com',
        password: 'password123',
        role: 'admin',
      });

      await User.create({
        name: 'Librarian 1',
        email: 'librarian1@example.com',
        password: 'password123',
        role: 'librarian',
      });

      await User. create({
        name: 'Member 1',
        email: 'member1@example.com',
        password: 'password123',
        role: 'member',
      });
    });

    it('should return user statistics', async () => {
      const req = {
        user: { userId: 'admin-id', role: 'admin' },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await userController.getUserStatistics(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalUsers: expect.any(Number),
            activeUsers:  expect.any(Number),
            inactiveUsers: expect.any(Number),
            usersByRole: expect.any(Object),
          }),
        })
      );
    });
  });
});