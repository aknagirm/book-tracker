import { getDatabase } from './database';
import { WishlistBook } from '../types';

export async function getAllWishlistBooks(): Promise<WishlistBook[]> {
  const db = await getDatabase();
  return await db.getAllAsync<WishlistBook>(
    'SELECT * FROM wishlist ORDER BY addedDate DESC'
  );
}

export async function insertWishlistBook(book: Omit<WishlistBook, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO wishlist (title, author, publication, expectedPrice, notes, addedDate)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      book.title,
      book.author,
      book.publication || '',
      book.expectedPrice || 0,
      book.notes || '',
      book.addedDate,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteWishlistBook(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM wishlist WHERE id = ?', [id]);
}

export async function moveWishlistToBooks(wishlistId: number): Promise<number> {
  const db = await getDatabase();
  const wishlistBook = await db.getFirstAsync<WishlistBook>(
    'SELECT * FROM wishlist WHERE id = ?',
    [wishlistId]
  );

  if (!wishlistBook) throw new Error('Wishlist book not found');

  const now = new Date().toISOString().split('T')[0];
  const result = await db.runAsync(
    `INSERT INTO books (title, author, publication, actualPrice, discountedPrice, purchasedDate, readingStartDate, completionDate, isSold, soldDate, soldPrice, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      wishlistBook.title,
      wishlistBook.author,
      wishlistBook.publication || '',
      wishlistBook.expectedPrice || 0,
      wishlistBook.expectedPrice || 0,
      now,
      '',
      '',
      0,
      '',
      0,
      now,
    ]
  );

  await db.runAsync('DELETE FROM wishlist WHERE id = ?', [wishlistId]);
  return result.lastInsertRowId;
}

export async function insertWishlistBooksInBulk(books: Omit<WishlistBook, 'id'>[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const book of books) {
      await db.runAsync(
        `INSERT INTO wishlist (title, author, publication, expectedPrice, notes, addedDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          book.title,
          book.author,
          book.publication || '',
          book.expectedPrice || 0,
          book.notes || '',
          book.addedDate,
        ]
      );
    }
  });
}
