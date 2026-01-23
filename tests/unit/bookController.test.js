const { Book } = require('../../src/models');
const bookController = require('../../src/controllers/bookController');

describe('Book Controller', () => {
  describe('getAllBooks', () => {
    it('should return all active books with pagination', async () => {
      await Book.create({
        title: 'Test Book 1',
        author:  'Author 1',
        isbn: '1234567890',
        category: 'Fiction',
      });

      await Book.create({
        title: 'Test Book 2',
        author: 'Author 2',
        isbn: '0987654321',
        category: 'Non-fiction',
      });

      const req = {
        query: { page: 1, limit: 10 },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.getAllBooks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            total: 2,
            page:  1,
            limit: 10,
            pages: 1,
          }),
        })
      );
    });

    it('should filter books by category', async () => {
      await Book.create({
        title: 'Fiction Book',
        author: 'Author 1',
        isbn: '1234567890',
        category:  'Fiction',
      });

      await Book.create({
        title: 'Non-fiction Book',
        author: 'Author 2',
        isbn: '0987654321',
        category: 'Non-fiction',
      });

      const req = {
        query: { category: 'Fiction', page: 1, limit: 10 },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.getAllBooks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ category: 'Fiction' }),
          ]),
        })
      );
    });

    it('should search books by title, author, or isbn', async () => {
      await Book.create({
        title: 'The Great Gatsby',
        author:  'F. Scott Fitzgerald',
        isbn: '1234567890',
      });

      const req = {
        query: { search: 'Gatsby', page: 1, limit: 10 },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.getAllBooks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ title: 'The Great Gatsby' }),
          ]),
        })
      );
    });
  });

  describe('getBookById', () => {
    it('should return a book by ID', async () => {
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
      });

      const req = {
        params: { id: book. id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.getBookById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: book.id }),
        })
      );
    });

    it('should return 404 for non-existent book', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.getBookById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createBook', () => {
    it('should create a new book', async () => {
      const req = {
        body:  {
          title: 'New Book',
          author: 'New Author',
          isbn: '9876543210',
          description: 'A great book',
          publishedYear: 2023,
          totalCopies: 5,
          category: 'Fiction',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.createBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message:  'Book created successfully',
          data: expect.objectContaining({
            title: 'New Book',
            isbn: '9876543210',
          }),
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const req = {
        body: {
          title:  'New Book',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.createBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(400);
    });

    it('should return 409 for duplicate ISBN', async () => {
      await Book.create({
        title: 'Existing Book',
        author: 'Existing Author',
        isbn: '1234567890',
      });

      const req = {
        body: {
          title:  'New Book',
          author: 'New Author',
          isbn: '1234567890',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.createBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:  'Book with this ISBN already exists',
        })
      );
    });
  });

  describe('updateBook', () => {
    it('should update a book', async () => {
      const book = await Book.create({
        title: 'Original Title',
        author: 'Original Author',
        isbn: '1234567890',
      });

      const req = {
        params: { id: book.id },
        body: {
          title: 'Updated Title',
        },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.updateBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message:  'Book updated successfully',
          data: expect.objectContaining({ title: 'Updated Title' }),
        })
      );
    });

    it('should return 404 for non-existent book', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
        body: { title: 'Updated Title' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.updateBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteBook', () => {
    it('should soft delete a book', async () => {
      const book = await Book. create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
      });

      const req = {
        params: { id: book.id },
      };

      const res = {
        status: jest. fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.deleteBook(req, res, next);

      expect(res. status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message:  'Book deleted successfully',
        })
      );

      const deletedBook = await Book.findByPk(book.id);
      expect(deletedBook. isActive).toBe(false);
    });

    it('should return 404 for non-existent book', async () => {
      const req = {
        params: { id: 'nonexistent-id' },
      };

      const res = {
        status:  jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();

      await bookController.deleteBook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});