-- ==========================================
-- LIBRARY MANAGEMENT SYSTEM - INITIAL DATA
-- ==========================================
-- Create extension for UUID
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- CREATE USERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "Users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profileImage VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('member', 'librarian', 'admin')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CREATE BOOKS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "Books" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  coverImage VARCHAR(255),
  "publishedYear" INTEGER,
  "totalCopies" INTEGER NOT NULL DEFAULT 1,
  "availableCopies" INTEGER NOT NULL DEFAULT 1,
  category VARCHAR(100),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CREATE BORROWRECORDS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "BorrowRecords" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "bookId" UUID NOT NULL REFERENCES "Books"(id) ON DELETE CASCADE,
  "borrowDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dueDate" TIMESTAMP NOT NULL,
  "returnDate" TIMESTAMP,
  status VARCHAR(50) NOT NULL CHECK (status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed',
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON "Books"(isbn);
CREATE INDEX IF NOT EXISTS idx_borrowrecords_userId ON "BorrowRecords"("userId");
CREATE INDEX IF NOT EXISTS idx_borrowrecords_bookId ON "BorrowRecords"("bookId");
CREATE INDEX IF NOT EXISTS idx_borrowrecords_status ON "BorrowRecords"(status);

-- ==========================================
-- INSERT USERS
-- ==========================================
-- Password: password123456
-- Hash: $2a$10$WT795LIy3saKdPU1aBv/Fut0fMkffqF9UWAettEmHCESs6CKF8xOy
-- ==========================================

INSERT INTO "Users" (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES 
(
  'a1111111-1111-1111-1111-111111111111',
  'Admin User',
  'admin@example.com',
  '$2a$10$AEAQc/T8yMrbBbpS2JwSmukTRrWiIos2Kj9LkamlJB/YJJ4z1xeLm',
  'admin',
  true,
  NOW(),
  NOW()
),
(
  'a2222222-2222-2222-2222-222222222222',
  'Librarian User',
  'librarian@example.com',
  '$2a$10$AEAQc/T8yMrbBbpS2JwSmukTRrWiIos2Kj9LkamlJB/YJJ4z1xeLm',
  'librarian',
  true,
  NOW(),
  NOW()
),
(
  'a3333333-3333-3333-3333-333333333333',
  'John Doe',
  'john@example.com',
  '$2a$10$AEAQc/T8yMrbBbpS2JwSmukTRrWiIos2Kj9LkamlJB/YJJ4z1xeLm',
  'member',
  true,
  NOW(),
  NOW()
),
(
  'a4444444-4444-4444-4444-444444444444',
  'Jane Smith',
  'jane@example.com',
  '$2a$10$AEAQc/T8yMrbBbpS2JwSmukTRrWiIos2Kj9LkamlJB/YJJ4z1xeLm',
  'member',
  true,
  NOW(),
  NOW()
);

-- ==========================================
-- INSERT BOOKS
-- ==========================================

INSERT INTO "Books" (id, title, author, isbn, description, "publishedYear", "totalCopies", "availableCopies", category, "isActive", "createdAt", "updatedAt")
VALUES
(
  'b1111111-1111-1111-1111-111111111111',
  'The Great Gatsby',
  'F. Scott Fitzgerald',
  '9780743273565',
  'A classic American novel set in the Jazz Age.',
  1925,
  5,
  5,
  'Fiction',
  true,
  NOW(),
  NOW()
),
(
  'b2222222-2222-2222-2222-222222222222',
  '1984',
  'George Orwell',
  '9780451524935',
  'A dystopian social science fiction novel.',
  1949,
  4,
  4,
  'Fiction',
  true,
  NOW(),
  NOW()
),
(
  'b3333333-3333-3333-3333-333333333333',
  'To Kill a Mockingbird',
  'Harper Lee',
  '9780061120084',
  'A gripping tale of racial injustice and childhood innocence.',
  1960,
  6,
  6,
  'Fiction',
  true,
  NOW(),
  NOW()
),
(
  'b4444444-4444-4444-4444-444444444444',
  'Pride and Prejudice',
  'Jane Austen',
  '9780141439518',
  'A romantic novel of manners.',
  1813,
  5,
  5,
  'Romance',
  true,
  NOW(),
  NOW()
),
(
  'b5555555-5555-5555-5555-555555555555',
  'The Catcher in the Rye',
  'J.D. Salinger',
  '9780316769174',
  'A story about teenage rebellion and alienation.',
  1951,
  3,
  3,
  'Fiction',
  true,
  NOW(),
  NOW()
),
(
  'b6666666-6666-6666-6666-666666666666',
  'Sapiens',
  'Yuval Noah Harari',
  '9780062316097',
  'A brief history of humankind.',
  2011,
  7,
  7,
  'Non-fiction',
  true,
  NOW(),
  NOW()
),
(
  'b7777777-7777-7777-7777-777777777777',
  'Atomic Habits',
  'James Clear',
  '9780735211292',
  'Build good habits and break bad ones.',
  2018,
  8,
  8,
  'Self-Help',
  true,
  NOW(),
  NOW()
),
(
  'b8888888-8888-8888-8888-888888888888',
  'The Hobbit',
  'J.R.R. Tolkien',
  '9780547928227',
  'A fantasy adventure of a hobbit named Bilbo Baggins.',
  1937,
  4,
  4,
  'Fantasy',
  true,
  NOW(),
  NOW()
),
(
  'b9999999-9999-9999-9999-999999999999',
  'Dune',
  'Frank Herbert',
  '9780441172719',
  'An epic science fiction novel.',
  1965,
  5,
  5,
  'Science Fiction',
  true,
  NOW(),
  NOW()
),
(
  'ba111111-1111-1111-1111-111111111111',
  'The Lord of the Rings',
  'J.R.R. Tolkien',
  '9780544003415',
  'An epic high fantasy trilogy.',
  1954,
  6,
  6,
  'Fantasy',
  true,
  NOW(),
  NOW()
),
(
  'bb111111-1111-1111-1111-111111111111',
  'Harry Potter and the Philosophers Stone',
  'J.K. Rowling',
  '9780747532699',
  'The first book in the Harry Potter series.',
  1998,
  10,
  10,
  'Fantasy',
  true,
  NOW(),
  NOW()
),
(
  'bc111111-1111-1111-1111-111111111111',
  'A Brief History of Time',
  'Stephen Hawking',
  '9780553380163',
  'From the Big Bang to Black Holes.',
  1988,
  3,
  3,
  'Science',
  true,
  NOW(),
  NOW()
);

-- ==========================================
-- INSERT BORROW RECORDS
-- ==========================================

INSERT INTO "BorrowRecords" (id, "userId", "bookId", "borrowDate", "dueDate", "returnDate", status, "createdAt", "updatedAt")
VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'a3333333-3333-3333-3333-333333333333',
  'b1111111-1111-1111-1111-111111111111',
  NOW(),
  NOW() + INTERVAL '14 days',
  NULL,
  'borrowed',
  NOW(),
  NOW()
),
(
  'c2222222-2222-2222-2222-222222222222',
  'a4444444-4444-4444-4444-444444444444',
  'b2222222-2222-2222-2222-222222222222',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  NULL,
  'borrowed',
  NOW(),
  NOW()
);

-- ==========================================
-- VERIFY DATA
-- ==========================================

SELECT 
  (SELECT COUNT(*) FROM "Users") as total_users,
  (SELECT COUNT(*) FROM "Books") as total_books,
  (SELECT COUNT(*) FROM "BorrowRecords") as total_borrow_records;

-- ==========================================
-- LOGIN CREDENTIALS (All passwords: password123456)
-- ==========================================
-- Admin: admin@example.com
-- Librarian: librarian@example.com
-- Member: john@example.com
-- Member: jane@example.com
-- ==========================================