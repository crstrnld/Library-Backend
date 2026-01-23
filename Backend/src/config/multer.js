const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const uploadDirs = ['./uploads', './uploads/books', './uploads/profiles'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for books
const booksStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/books');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Storage configuration for profiles
const profilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes. includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.  Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

// Create multer instances
const uploadBooks = multer({
  storage:  booksStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadProfiles = multer({
  storage: profilesStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = {
  uploadBooks,
  uploadProfiles,
};