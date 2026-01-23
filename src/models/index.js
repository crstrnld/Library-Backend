const User = require('./User');
const Book = require('./Book');
const BorrowRecord = require('./BorrowRecord');

// Define associations
User.hasMany(BorrowRecord, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

BorrowRecord.belongsTo(User, {
  foreignKey:  'userId',
});

Book.hasMany(BorrowRecord, {
  foreignKey: 'bookId',
  onDelete: 'CASCADE',
});

BorrowRecord.belongsTo(Book, {
  foreignKey: 'bookId',
});

module.exports = {
  User,
  Book,
  BorrowRecord,
};