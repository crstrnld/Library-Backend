const express = require('express');
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middlewares/auth');
const roleCheckMiddleware = require('../middlewares/roleCheck');
const { uploadBooks } = require('../config/multer');

const router = express.Router();

// Get all books (public)
router.get('/', bookController.getAllBooks);

// Get book by ID (public)
router.get('/:id', bookController. getBookById);

// ==========================================
// CREATE BOOK - HANYA ADMIN & LIBRARIAN
// ==========================================
router.post(
  '/',
  authMiddleware,
  roleCheckMiddleware(['librarian', 'admin']),
  uploadBooks.single('coverImage'),
  bookController.createBook
);

// ==========================================
// UPDATE BOOK - HANYA ADMIN & LIBRARIAN
// ==========================================
router.put(
  '/:id',
  authMiddleware,
  roleCheckMiddleware(['librarian', 'admin']),
  uploadBooks.single('coverImage'),
  bookController.updateBook
);

// ==========================================
// DELETE BOOK - HANYA ADMIN & LIBRARIAN
// ==========================================
router.delete(
  '/:id',
  authMiddleware,
  roleCheckMiddleware(['librarian', 'admin']),
  bookController.deleteBook
);

module.exports = router;