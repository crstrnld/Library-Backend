const { Book } = require('../models');
const fs = require('fs');
const path = require('path');

// Get all books
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category, limit = 20, offset = 0 } = req. query;
    const where = { isActive: true };

    if (search) {
      where[sequelize.Op. or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), 'LIKE', `%${search. toLowerCase()}%`),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('author')), 'LIKE', `%${search.toLowerCase()}%`),
      ];
    }

    if (category) {
      where.category = category;
    }

    const books = await Book.findAndCountAll({
      where,
      limit:  parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: books. rows,
      pagination: {
        total: books.count,
        limit:  parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get book by ID
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params. id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// Create book
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, description, publishedYear, totalCopies, category } = req.body;

    // Validation
    if (!title || !author || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, and ISBN are required',
      });
    }

    // Check if ISBN already exists
    const existingBook = await Book.findOne({ where: { isbn } });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: 'Book with this ISBN already exists',
      });
    }

    const bookData = {
      title,
      author,
      isbn,
      description,
      publishedYear,
      totalCopies:  totalCopies || 1,
      availableCopies: totalCopies || 1,
      category,
    };

    // Handle cover image upload
    if (req. file) {
      bookData.coverImage = `/uploads/books/${req.file.filename}`;
    }

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// Update book
exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req. params;
    const { title, author, description, publishedYear, totalCopies, category } = req.body;

    const book = await Book.findByPk(id);

    if (!book) {
      return res. status(404).json({
        success: false,
        message:  'Book not found',
      });
    }

    // Update fields
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (publishedYear) book.publishedYear = publishedYear;
    if (totalCopies) {
      book.totalCopies = totalCopies;
      if (book.availableCopies > totalCopies) {
        book.availableCopies = totalCopies;
      }
    }
    if (category) book.category = category;

    // Handle cover image upload
    if (req.file) {
      // Delete old image if exists
      if (book.coverImage) {
        const oldImagePath = path. join(__dirname, '../../uploads/books', path.basename(book. coverImage));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      book.coverImage = `/uploads/books/${req.file.filename}`;
    }

    await book. save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data:  book,
    });
  } catch (error) {
    next(error);
  }
};

// Delete book
exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req. params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Delete cover image if exists
    if (book.coverImage) {
      const imagePath = path.join(__dirname, '../../uploads/books', path.basename(book.coverImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await book.destroy();

    res.status(200).json({
      success: true,
      message:  'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};