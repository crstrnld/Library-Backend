const { User } = require('../../src/models');
const authController = require('../../src/controllers/authController');

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          token:  expect.any(String),
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          name: 'John Doe',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest. fn();

      await authController. register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect. objectContaining({
          success:  false,
          message: 'Name, email, and password are required',
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User with this email already exists',
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email:  'test@example.com',
        password: 'password123',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res. status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          token: expect.any(String),
        })
      );
    });

    it('should return 401 for invalid email', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for invalid password', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          email: 'test@example.com',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const req = {
        user:  { userId: user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: 'john@example.com',
            name: 'John Doe',
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const req = {
        user: { userId: 'nonexistent-id' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await authController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});