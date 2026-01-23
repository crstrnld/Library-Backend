const express = require('express');
const borrowController = require('../controllers/borrowController');
const authMiddleware = require('../middlewares/auth');
const roleCheckMiddleware = require('../middlewares/roleCheck');

const router = express. Router();

// Member routes
router.post(
  '/borrow',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.borrowBook
);

router.post(
  '/return',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.returnBook
);

router.get(
  '/history/my',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.getBorrowHistory
);

router.get(
  '/overdue/my',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.getOverdueBooks
);

// Librarian/Admin routes
router.get(
  '/records/all',
  authMiddleware,
  roleCheckMiddleware(['librarian', 'admin']),
  borrowController.getAllBorrowRecords
);

module.exports = router;