const express = require('express');
const borrowController = require('../controllers/borrowController');
const authMiddleware = require('../middlewares/auth');
const roleCheckMiddleware = require('../middlewares/roleCheck');

const router = express.Router();

// ==========================================
// Member routes
// ==========================================

// Pinjam buku → POST /api/borrow
router.post(
  '/',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.borrowBook
);

// Kembalikan buku → POST /api/borrow/return
router.post(
  '/return',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.returnBook
);

// Riwayat pinjaman user → GET /api/borrow/history/my
router.get(
  '/history/my',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.getBorrowHistory
);

// Buku yang overdue → GET /api/borrow/overdue/my
router.get(
  '/overdue/my',
  authMiddleware,
  roleCheckMiddleware(['member', 'librarian', 'admin']),
  borrowController.getOverdueBooks
);

// ==========================================
// Librarian/Admin routes
// ==========================================

// Semua catatan pinjaman → GET /api/borrow/records/all
router.get(
  '/records/all',
  authMiddleware,
  roleCheckMiddleware(['librarian', 'admin']),
  borrowController.getAllBorrowRecords
);

module.exports = router;
