const { BorrowRecord, Book, User } = require('../../src/models');
const borrowController = require('../../src/controllers/borrowController');

describe('Borrow Controller', () => {
  let user, book;

  beforeEach(async () => {
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    book = await Book.create({
      title: 'Test Book',
      author:  'Test Author',
      isbn: '1234567890',
      totalCopies: 5,
      availableCopies: 5,
    });
  });

  describe('borrowBook', () => {
    it('should borrow a book successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const req = {
        body: {
          bookId: book.id,
          dueDate: futureDate.toISOString(),
        },
        user: { userId: user.id },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.borrowBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Book borrowed successfully',
        })
      );

      const updatedBook = await Book.findByPk(book.id);
      expect(updatedBook.availableCopies).toBe(4);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          bookId:  book.id,
        },
        user: { userId: user. id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.borrowBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent book', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const req = {
        body: {
          bookId: 'nonexistent-id',
          dueDate: futureDate.toISOString(),
        },
        user: { userId:  user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest. fn(),
      };

      const next = jest.fn();

      await borrowController.borrowBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when no copies available', async () => {
      await Book.update({ availableCopies: 0 }, { where: { id: book.id } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const req = {
        body: {
          bookId: book.id,
          dueDate: futureDate. toISOString(),
        },
        user: { userId: user.id },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.borrowBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No copies available for this book',
        })
      );
    });

    it('should return 400 for past due date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate. getDate() - 1);

      const req = {
        body: {
          bookId: book.id,
          dueDate: pastDate.toISOString(),
        },
        user: { userId: user.id },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.borrowBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(400);
    });
  });

  describe('returnBook', () => {
    it('should return a book successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const borrowRecord = await BorrowRecord.create({
        userId: user.id,
        bookId: book.id,
        dueDate: futureDate,
      });

      await book.update({ availableCopies: 4 });

      const req = {
        body: {
          borrowRecordId: borrowRecord.id,
        },
        user: { userId: user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.returnBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Book returned successfully',
        })
      );

      const updatedBook = await Book.findByPk(book.id);
      expect(updatedBook.availableCopies).toBe(5);
    });

    it('should return 400 if record already returned', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      const borrowRecord = await BorrowRecord. create({
        userId: user. id,
        bookId: book.id,
        dueDate: futureDate,
        returnDate: new Date(),
        status: 'returned',
      });

      const req = {
        body: {
          borrowRecordId: borrowRecord.id,
        },
        user: { userId: user. id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.returnBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent borrow record', async () => {
      const req = {
        body: {
          borrowRecordId: 'nonexistent-id',
        },
        user: { userId:  user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest. fn(),
      };

      const next = jest.fn();

      await borrowController.returnBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getBorrowHistory', () => {
    it('should return borrow history for user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: user.id,
        bookId: book.id,
        dueDate: futureDate,
      });

      const req = {
        query: { page: 1, limit: 10 },
        user: { userId: user.id },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.getBorrowHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should filter by status', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: user.id,
        bookId: book.id,
        dueDate: futureDate,
        status: 'borrowed',
      });

      const req = {
        query: { status: 'borrowed', page: 1, limit: 10 },
        user: { userId: user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.getBorrowHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getOverdueBooks', () => {
    it('should return overdue books', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate. getDate() - 1);

      await BorrowRecord.create({
        userId: user.id,
        bookId: book.id,
        dueDate: pastDate,
        status: 'borrowed',
      });

      const req = {
        user: { userId: user.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest. fn();

      await borrowController. getOverdueBooks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ status: 'borrowed' }),
          ]),
        })
      );
    });
  });

  describe('getAllBorrowRecords', () => {
    it('should return all borrow records for admin/librarian', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      await BorrowRecord.create({
        userId: user.id,
        bookId: book.id,
        dueDate: futureDate,
      });

      const req = {
        query: { page:  1, limit: 10 },
        user: { userId:  'admin-id', role: 'admin' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await borrowController.getAllBorrowRecords(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });
  });
});