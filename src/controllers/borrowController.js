const { BorrowRecord, Book, User } = require('../models');
const { Op } = require('sequelize');

exports.borrowBook = async (req, res, next) => {
  try {
    const { bookId, dueDate } = req.body;
    const userId = req.user.userId;

    if (!bookId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and due date are required',
      });
    }

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available for this book' });
    }

    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return res.status(400).json({ success: false, message: 'Due date must be in the future' });
    }

    const borrowRecord = await BorrowRecord.create({ userId, bookId, dueDate: dueDateObj });

    await book.update({ availableCopies: book.availableCopies - 1 });

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: borrowRecord,
    });
  } catch (error) {
    next(error);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const { borrowRecordId } = req.body;
    const userId = req.user.userId;

    if (!borrowRecordId) {
      return res.status(400).json({ success: false, message: 'Borrow record ID is required' });
    }

    const borrowRecord = await BorrowRecord.findByPk(borrowRecordId);

    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Borrow record not found' });
    }

    if (borrowRecord.userId !== userId) {
      return res.status(403).json({ success: false, message: 'You can only return your own borrowed books' });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This book has already been returned' });
    }

    const book = await Book.findByPk(borrowRecord.bookId);

    await borrowRecord.update({ returnDate: new Date(), status: 'returned' });
    await book.update({ availableCopies: book.availableCopies + 1 });

    res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: borrowRecord,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBorrowHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = { userId };
    if (status) where.status = status;

    const { count, rows } = await BorrowRecord.findAndCountAll({
      where,
      include: [
        {
          model: Book,
          attributes: ['id', 'title', 'author', 'isbn', 'coverImage', 'category', 'publishedYear'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['borrowDate', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOverdueBooks = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const overdueRecords = await BorrowRecord.findAll({
      where: {
        userId,
        status: 'borrowed',
        dueDate: { [Op.lt]: new Date() },
      },
      include: [
        {
          model: Book,
          attributes: ['id', 'title', 'author', 'isbn', 'coverImage', 'category', 'publishedYear'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    res.status(200).json({ success: true, data: overdueRecords });
  } catch (error) {
    next(error);
  }
};

exports.getAllBorrowRecords = async (req, res, next) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const { count, rows } = await BorrowRecord.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        {
          model: Book,
          attributes: ['id', 'title', 'author', 'isbn', 'coverImage', 'category', 'publishedYear'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['borrowDate', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
