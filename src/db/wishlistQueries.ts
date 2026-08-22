import { getDatabase } from './database';
import { WishlistBook } from '../types';
import { notifyWishlistChanged } from './wishlistEvents';

export async function getAllWishlistBooks(): Promise<WishlistBook[]> {
  const db = await getDatabase();
  return await db.getAllAsync<WishlistBook>(
    'SELECT * FROM wishlist ORDER BY addedDate DESC',
    []
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
  notifyWishlistChanged();
  return result.lastInsertRowId;
}

export async function deleteWishlistBook(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM wishlist WHERE id = ?', [id]);
  notifyWishlistChanged();
}

export async function moveWishlistToBooks(
  wishlistId: number,
  purchasedDate: string,
  actualPrice: number,
  discountedPrice: number
): Promise<number> {
  const db = await getDatabase();
  const wishlistBook = await db.getFirstAsync<WishlistBook>(
    'SELECT * FROM wishlist WHERE id = ?',
    [wishlistId]
  );

  if (!wishlistBook) throw new Error('Wishlist book not found');

  const now = new Date().toISOString().split('T')[0];
  const result = await db.runAsync(
    `INSERT INTO books (coverUri, title, author, publication, actualPrice, discountedPrice, purchasedDate, readingStartDate, completionDate, isSold, soldDate, soldPrice, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      '',
      wishlistBook.title,
      wishlistBook.author,
      wishlistBook.publication || '',
      actualPrice,
      discountedPrice,
      purchasedDate,
      '',
      '',
      0,
      '',
      0,
      now,
    ]
  );

  await db.runAsync('DELETE FROM wishlist WHERE id = ?', [wishlistId]);
  notifyWishlistChanged();
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
  notifyWishlistChanged();
}
