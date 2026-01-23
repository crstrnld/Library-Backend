const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Users Integration Tests', () => {
  let adminToken;
  let memberToken;
  let librarianToken;
  let adminId;
  let memberId;
  let librarianId;

  beforeEach(async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    const member = await User.create({
      name: 'Member User',
      email: 'member@example.com',
      password: 'password123',
      role:  'member',
    });

    const librarian = await User. create({
      name: 'Librarian User',
      email: 'librarian@example. com',
      password: 'password123',
      role: 'librarian',
    });

    adminId = admin.id;
    memberId = member.id;
    librarianId = librarian.id;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.com',
        password: 'password123',
      });

    const librarianLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'librarian@example.com',
        password: 'password123',
      });

    adminToken = adminLogin.body.token;
    memberToken = memberLogin.body.token;
    librarianToken = librarianLogin.body.token;
  });

  describe('GET /api/users', () => {
    it('should return all users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should not allow member to view all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
      expect(response.body. success).toBe(false);
    });

    it('should not allow librarian to view all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(403);
    });

    it('should not allow unauthenticated access', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response. body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'admin' }),
        ])
      );
    });

    it('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'member' });

      expect(response. status).toBe(200);
      expect(response.body.data).toEqual(
        expect. arrayContaining([
          expect. objectContaining({
            name: expect.stringContaining('Member'),
          }),
        ])
      );
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 5 });

      expect(response. status).toBe(200);
      expect(response.body.pagination).toEqual(
        expect. objectContaining({
          page:  1,
          limit: 5,
        })
      );
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((user) => {
        expect(user. password).toBeUndefined();
      });
    });
  });

  describe('GET /api/users/: id', () => {
    it('should return user profile for self', async () => {
      const response = await request(app)
        .get(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: memberId }),
        })
      );
    });

    it('should return user profile as admin', async () => {
      const response = await request(app)
        .get(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body. success).toBe(true);
    });

    it('should not allow viewing other user profile as member', async () => {
      const response = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data. password).toBeUndefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile as member', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated Member',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Profile updated successfully',
          data: expect.objectContaining({ name: 'Updated Member' }),
        })
      );
    });

    it('should not allow member to update other user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(403);
    });

    it('should allow admin to update other user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body. success).toBe(true);
    });

    it('should not allow duplicate email', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          email: 'admin@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already in use');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/users/: id/change-password', () => {
    it('should change own password', async () => {
      const response = await request(app)
        .post(`/api/users/${memberId}/change-password`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        });

      expect(response.status).toBe(200);
      expect(response. body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'member@example.com',
          password: 'newpassword456',
        });

      expect(loginResponse. status).toBe(200);
    });

    it('should return 401 for incorrect current password', async () => {
      const response = await request(app)
        .post(`/api/users/${memberId}/change-password`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('incorrect');
    });

    it('should return 400 when passwords do not match', async () => {
      const response = await request(app)
        .post(`/api/users/${memberId}/change-password`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
          confirmPassword: 'differentpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('do not match');
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post(`/api/users/${memberId}/change-password`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'short',
          confirmPassword: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 6');
    });

    it('should not allow member to change other user password', async () => {
      const response = await request(app)
        .post(`/api/users/${adminId}/change-password`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
          confirmPassword:  'newpassword456',
        });

      expect(response. status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'librarian',
        });

      expect(response.status).toBe(200);
      expect(response. body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User role updated successfully',
          data: expect.objectContaining({ role: 'librarian' }),
        })
      );
    });

    it('should not allow member to update role', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          role: 'admin',
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .put(`/api/users/${memberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'superadmin',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must be one of');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/nonexistent-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'librarian',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('should deactivate user as admin', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User deactivated successfully',
          data: expect.objectContaining({ isActive: false }),
        })
      );
    });

    it('should activate user as admin', async () => {
      // First deactivate
      await User.update({ isActive: false }, { where: { id: memberId } });

      const response = await request(app)
        .patch(`/api/users/${memberId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body. data.isActive).toBe(true);
    });

    it('should not allow member to toggle status', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberId}/status`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch('/api/users/nonexistent-id/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response. body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User deleted successfully',
        })
      );

      const deletedUser = await User.findByPk(memberId);
      expect(deletedUser.isActive).toBe(false);
    });

    it('should not allow member to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/statistics/all', () => {
    it('should return user statistics as admin', async () => {
      const response = await request(app)
        .get('/api/users/statistics/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalUsers:  expect.any(Number),
            activeUsers: expect.any(Number),
            inactiveUsers:  expect.any(Number),
            usersByRole: expect.any(Object),
          }),
        })
      );
    });

    it('should not allow member to view statistics', async () => {
      const response = await request(app)
        .get('/api/users/statistics/all')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });

    it('should not allow unauthenticated access', async () => {
      const response = await request(app).get('/api/users/statistics/all');

      expect(response.status).toBe(401);
    });
  });
});