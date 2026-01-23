const request = require('supertest');
const app = require('../../src/app');
const { User, Book, BorrowRecord } = require('../../src/models');

describe('Borrow Integration Tests', () => {
  let memberToken;
  let librarianToken;
  let adminToken;
  let memberId;
  let bookId;
  let book2Id;

  beforeEach(async () => {
    const member = await User.create({
      name: 'Member User',
      email: 'member@example.com',
      password: 'password123',
      role:  'member',
    });

    const librarian = await User.create({
      name: 'Librarian User',
      email: 'librarian@example.com',
      password: 'password123',
      role: 'librarian',
    });

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role:  'admin',
    });

    const book1 = await Book.create({
      title: 'Test Book 1',
      author:  'Author 1',
      isbn: '1234567890',
      totalCopies: 5,
      availableCopies: 5,
    });

    const book2 = await Book.create({
      title: 'Test Book 2',
      author: 'Author 2',
      isbn:  '0987654321',
      totalCopies: 2,
      availableCopies: 2,
    });

    memberId = member.id;
    bookId = book1.id;
    book2Id = book2.id;

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example. com',
        password: 'password123',
      });

    const librarianLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'librarian@example.com',
        password: 'password123',
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });

    memberToken = memberLogin.body.token;
    librarianToken = librarianLogin.body.token;
    adminToken = adminLogin.body.token;
  });

  describe('POST /api/borrow/borrow', () => {
    it('should borrow a book successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          bookId,
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect. objectContaining({
          success:  true,
          message: 'Book borrowed successfully',
          data:  expect.objectContaining({
            userId: memberId,
            bookId,
            status: 'borrowed',
          }),
        })
      );

      const updatedBook = await Book.findByPk(bookId);
      expect(updatedBook.availableCopies).toBe(4);
    });

    it('should not borrow without authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .send({
          bookId,
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(401);
      expect(response. body.success).toBe(false);
    });

    it('should not borrow with missing required fields', async () => {
      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          bookId,
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent book', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          bookId: 'nonexistent-id',
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(404);
    });

    it('should not borrow when no copies available', async () => {
      await Book.update({ availableCopies: 0 }, { where: { id:  bookId } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          bookId,
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body. message).toContain('No copies available');
    });

    it('should not borrow with past due date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate. getDate() - 1);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          bookId,
          dueDate: pastDate.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('future');
    });

    it('should allow librarian to borrow books', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId,
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response. body. success).toBe(true);
    });

    it('should allow admin to borrow books', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const response = await request(app)
        .post('/api/borrow/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId,
          dueDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/borrow/return', () => {
    let borrowRecordId;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const borrowRecord = await BorrowRecord.create({
        userId: memberId,
        bookId,
        dueDate: futureDate,
        status: 'borrowed',
      });

      borrowRecordId = borrowRecord.id;
      await Book.update({ availableCopies: 4 }, { where:  { id: bookId } });
    });

    it('should return a book successfully', async () => {
      const response = await request(app)
        .post('/api/borrow/return')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          borrowRecordId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Book returned successfully',
          data: expect.objectContaining({
            status: 'returned',
          }),
        })
      );

      const updatedBook = await Book.findByPk(bookId);
      expect(updatedBook.availableCopies).toBe(5);
    });

    it('should not return without authentication', async () => {
      const response = await request(app)
        .post('/api/borrow/return')
        .send({
          borrowRecordId,
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 with missing borrowRecordId', async () => {
      const response = await request(app)
        .post('/api/borrow/return')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent borrow record', async () => {
      const response = await request(app)
        .post('/api/borrow/return')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          borrowRecordId: 'nonexistent-id',
        });

      expect(response. status).toBe(404);
    });

    it('should not allow returning another user\'s book (member)', async () => {
      const otherMember = await User.create({
        name: 'Other Member',
        email: 'other@example.com',
        password: 'password123',
        role:  'member',
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example. com',
          password: 'password123',
        });

      const otherToken = otherLogin.body.token;

      const response = await request(app)
        .post('/api/borrow/return')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          borrowRecordId,
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 when book already returned', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const returnedRecord = await BorrowRecord.create({
        userId: memberId,
        bookId:  book2Id,
        dueDate: futureDate,
        returnDate: new Date(),
        status: 'returned',
      });

      const response = await request(app)
        .post('/api/borrow/return')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          borrowRecordId: returnedRecord.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already been returned');
    });
  });

  describe('GET /api/borrow/history/my', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: memberId,
        bookId,
        dueDate: futureDate,
        status: 'borrowed',
      });

      await BorrowRecord.create({
        userId: memberId,
        bookId:  book2Id,
        dueDate: futureDate,
        returnDate: new Date(),
        status: 'returned',
      });
    });

    it('should return user\'s borrow history', async () => {
      const response = await request(app)
        .get('/api/borrow/history/my')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response. body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/borrow/history/my')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ status: 'borrowed' });

      expect(response.status).toBe(200);
      expect(response. body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('borrowed');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/borrow/history/my')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ page: 1, limit:  1 });

      expect(response. status).toBe(200);
      expect(response.body.pagination).toEqual(
        expect. objectContaining({
          page:  1,
          limit: 1,
          pages: 2,
        })
      );
    });

    it('should not return history without authentication', async () => {
      const response = await request(app).get('/api/borrow/history/my');

      expect(response.status).toBe(401);
    });

    it('should include book details in history', async () => {
      const response = await request(app)
        .get('/api/borrow/history/my')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          Book: expect.objectContaining({
            title: expect.any(String),
            author: expect.any(String),
            isbn: expect.any(String),
          }),
        })
      );
    });
  });

  describe('GET /api/borrow/overdue/my', () => {
    beforeEach(async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate. getDate() - 5);

      await BorrowRecord.create({
        userId: memberId,
        bookId,
        dueDate: pastDate,
        status: 'borrowed',
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: memberId,
        bookId: book2Id,
        dueDate: futureDate,
        status: 'borrowed',
      });
    });

    it('should return overdue books for user', async () => {
      const response = await request(app)
        .get('/api/borrow/overdue/my')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('borrowed');
    });

    it('should include book details', async () => {
      const response = await request(app)
        .get('/api/borrow/overdue/my')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body. data[0]).toHaveProperty('Book');
    });

    it('should not return history without authentication', async () => {
      const response = await request(app).get('/api/borrow/overdue/my');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/borrow/records/all', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: memberId,
        bookId,
        dueDate:  futureDate,
        status:  'borrowed',
      });
    });

    it('should allow librarian to view all records', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(response. body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should allow admin to view all records', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body. success).toBe(true);
    });

    it('should not allow member to view all records', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });

    it('should not allow unauthenticated access', async () => {
      const response = await request(app).get('/api/borrow/records/all');

      expect(response. status).toBe(401);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${librarianToken}`)
        .query({ status: 'borrowed' });

      expect(response.status).toBe(200);
      expect(response. body.data[0].status).toBe('borrowed');
    });

    it('should filter by userId', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${librarianToken}`)
        .query({ userId: memberId });

      expect(response.status).toBe(200);
      expect(response.body.data[0]. userId).toBe(memberId);
    });

    it('should include user and book details', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          User: expect.any(Object),
          Book: expect.any(Object),
        })
      );
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/borrow/records/all')
        .set('Authorization', `Bearer ${librarianToken}`)
        .query({ page: 1, limit: 10 });

      expect(response. status).toBe(200);
      expect(response.body.pagination).toEqual(
        expect. objectContaining({
          page:  1,
          limit: 10,
        })
      );
    });
  });
});