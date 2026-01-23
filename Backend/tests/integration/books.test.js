const request = require('supertest');
const app = require('../../src/app');
const { User, Book } = require('../../src/models');

describe('Books Integration Tests', () => {
  let librarianToken;
  let memberToken;
  let adminToken;

  beforeEach(async () => {
    const librarian = await User.create({
      name: 'Librarian User',
      email: 'librarian@example.com',
      password: 'password123',
      role: 'librarian',
    });

    const member = await User.create({
      name: 'Member User',
      email: 'member@example. com',
      password: 'password123',
      role: 'member',
    });

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role:  'admin',
    });

    const librarianLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'librarian@example.com',
        password: 'password123',
      });

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.com',
        password: 'password123',
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    librarianToken = librarianLogin.body.token;
    memberToken = memberLogin.body.token;
    adminToken = adminLogin.body.token;
  });

  describe('GET /api/books', () => {
    it('should return all books without authentication', async () => {
      await Book.create({
        title: 'Test Book 1',
        author: 'Author 1',
        isbn: '1234567890',
        category: 'Fiction',
      });

      await Book.create({
        title: 'Test Book 2',
        author: 'Author 2',
        isbn: '0987654321',
        category: 'Non-fiction',
      });

      const response = await request(app).get('/api/books');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            total: 2,
            page:  1,
          }),
        })
      );
      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await Book.create({
          title: `Book ${i}`,
          author: `Author ${i}`,
          isbn: `${1234567890 + i}`,
        });
      }

      const response = await request(app)
        .get('/api/books')
        .query({ page: 2, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body. pagination).toEqual(
        expect.objectContaining({
          page: 2,
          limit:  5,
          pages: 3,
          total:  15,
        })
      );
    });

    it('should filter by category', async () => {
      await Book.create({
        title: 'Fiction Book',
        author: 'Author 1',
        isbn: '1234567890',
        category:  'Fiction',
      });

      await Book.create({
        title: 'Science Book',
        author: 'Author 2',
        isbn: '0987654321',
        category: 'Science',
      });

      const response = await request(app)
        .get('/api/books')
        .query({ category: 'Fiction' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Fiction');
    });

    it('should search by title', async () => {
      await Book.create({
        title: 'The Great Gatsby',
        author:  'F. Scott Fitzgerald',
        isbn: '1234567890',
      });

      const response = await request(app)
        .get('/api/books')
        .query({ search: 'Gatsby' });

      expect(response. status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body. data[0].title).toContain('Gatsby');
    });

    it('should search by author', async () => {
      await Book.create({
        title: 'Some Book',
        author: 'F. Scott Fitzgerald',
        isbn: '1234567890',
      });

      const response = await request(app)
        .get('/api/books')
        .query({ search: 'Fitzgerald' });

      expect(response. status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it('should not return inactive books', async () => {
      await Book.create({
        title: 'Active Book',
        author: 'Author 1',
        isbn:  '1234567890',
        isActive: true,
      });

      await Book.create({
        title: 'Inactive Book',
        author: 'Author 2',
        isbn: '0987654321',
        isActive: false,
      });

      const response = await request(app).get('/api/books');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]. title).toBe('Active Book');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a book by ID', async () => {
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
      });

      const response = await request(app).get(`/api/books/${book.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect. objectContaining({
          success:  true,
          data: expect.objectContaining({
            id: book.id,
            title: 'Test Book',
          }),
        })
      );
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app).get('/api/books/nonexistent-id');

      expect(response. status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/books', () => {
    it('should create a book as librarian', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '9876543210',
          description: 'A great book',
          publishedYear: 2023,
          totalCopies: 5,
          category: 'Fiction',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect. objectContaining({
          success:  true,
          message: 'Book created successfully',
          data:  expect.objectContaining({
            title: 'New Book',
            isbn: '9876543210',
            totalCopies: 5,
            availableCopies: 5,
          }),
        })
      );
    });

    it('should create a book as admin', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Book',
          author: 'Admin Author',
          isbn: '1111111111',
        });

      expect(response.status).toBe(201);
      expect(response.body. success).toBe(true);
    });

    it('should not allow member to create book', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '9876543210',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should not allow unauthenticated user to create book', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '9876543210',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'New Book',
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate ISBN', async () => {
      await Book.create({
        title: 'Existing Book',
        author: 'Existing Author',
        isbn:  '1234567890',
      });

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '1234567890',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const book = await Book.create({
        title: 'Original Title',
        author: 'Original Author',
        isbn: '1234567890',
        totalCopies: 3,
      });
      bookId = book.id;
    });

    it('should update a book as librarian', async () => {
      const response = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Updated Title',
          totalCopies: 5,
        });

      expect(response. status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Book updated successfully',
          data: expect. objectContaining({
            title:  'Updated Title',
            totalCopies: 5,
          }),
        })
      );
    });

    it('should not allow member to update book', async () => {
      const response = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put('/api/books/nonexistent-id')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(404);
    });

    it('should update only specified fields', async () => {
      const response = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'New Title Only',
        });

      expect(response.status).toBe(200);
      expect(response.body. data. title).toBe('New Title Only');
      expect(response.body.data. author).toBe('Original Author');
    });
  });

  describe('DELETE /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const book = await Book.create({
        title: 'Book to Delete',
        author: 'Test Author',
        isbn: '1234567890',
      });
      bookId = book.id;
    });

    it('should delete a book as librarian (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message:  'Book deleted successfully',
        })
      );

      const deletedBook = await Book.findByPk(bookId);
      expect(deletedBook. isActive).toBe(false);
    });

    it('should not allow member to delete book', async () => {
      const response = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/api/books/nonexistent-id')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(404);
    });
  });
});