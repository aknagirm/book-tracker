import { getDatabase } from './database';
import { Book } from '../types';

// expo-sqlite on Android throws NullPointerException for null params
// Convert null to empty string for text fields, 0 for numeric fields
function sanitize(value: string | null): string {
  return value ?? '';
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Book>(
    'SELECT * FROM books ORDER BY createdAt DESC',
    []
  );
  return results.map(row => ({
    ...row,
    isSold: Boolean(row.isSold),
    purchasedDate: row.purchasedDate || null,
    readingStartDate: row.readingStartDate || null,
    completionDate: row.completionDate || null,
    soldDate: row.soldDate || null,
  }));
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Book>(
    'SELECT * FROM books WHERE id = ?',
    [id]
  );
  if (!result) return null;
  return {
    ...result,
    isSold: Boolean(result.isSold),
    purchasedDate: result.purchasedDate || null,
    readingStartDate: result.readingStartDate || null,
    completionDate: result.completionDate || null,
    soldDate: result.soldDate || null,
  };
}

export async function insertBook(book: Omit<Book, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO books (coverUri, title, author, publication, actualPrice, discountedPrice, purchasedDate, readingStartDate, completionDate, isSold, soldDate, soldPrice, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      book.coverUri || '',
      book.title,
      book.author,
      book.publication || '',
      book.actualPrice || 0,
      book.discountedPrice || 0,
      sanitize(book.purchasedDate),
      sanitize(book.readingStartDate),
      sanitize(book.completionDate),
      book.isSold ? 1 : 0,
      sanitize(book.soldDate),
      book.soldPrice || 0,
      book.createdAt,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateBook(book: Book): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE books SET coverUri = ?, title = ?, author = ?, publication = ?, actualPrice = ?, discountedPrice = ?, purchasedDate = ?, readingStartDate = ?, completionDate = ?, isSold = ?, soldDate = ?, soldPrice = ?
     WHERE id = ?`,
    [
      book.coverUri || '',
      book.title,
      book.author,
      book.publication || '',
      book.actualPrice || 0,
      book.discountedPrice || 0,
      sanitize(book.purchasedDate),
      sanitize(book.readingStartDate),
      sanitize(book.completionDate),
      book.isSold ? 1 : 0,
      sanitize(book.soldDate),
      book.soldPrice || 0,
      book.id,
    ]
  );
}

export async function deleteBook(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
}

export async function sellBook(id: number, soldDate: string, soldPrice: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE books SET isSold = 1, soldDate = ?, soldPrice = ? WHERE id = ?',
    [soldDate, soldPrice, id]
  );
}

export async function getBooksByYear(year: number): Promise<Book[]> {
  const db = await getDatabase();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const results = await db.getAllAsync<Book>(
    `SELECT * FROM books WHERE purchasedDate BETWEEN ? AND ? ORDER BY purchasedDate ASC`,
    [startDate, endDate]
  );
  return results.map(row => ({
    ...row,
    isSold: Boolean(row.isSold),
    purchasedDate: row.purchasedDate || null,
    readingStartDate: row.readingStartDate || null,
    completionDate: row.completionDate || null,
    soldDate: row.soldDate || null,
  }));
}

export async function getPurchasedStats(): Promise<{ year: number; month: number; count: number; totalSpent: number }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT 
      CAST(strftime('%Y', purchasedDate) AS INTEGER) as year,
      CAST(strftime('%m', purchasedDate) AS INTEGER) as month,
      COUNT(*) as count,
      SUM(COALESCE(discountedPrice, actualPrice)) as totalSpent
    FROM books 
    WHERE purchasedDate IS NOT NULL AND purchasedDate != ''
    GROUP BY year, month
    ORDER BY year DESC, month DESC`,
    []
  );
}

export async function getCompletedStats(): Promise<{ year: number; month: number; count: number }[]> {
  const db = await getDatabase();
  return await db.getAllAsync(
    `SELECT 
      CAST(strftime('%Y', completionDate) AS INTEGER) as year,
      CAST(strftime('%m', completionDate) AS INTEGER) as month,
      COUNT(*) as count
    FROM books 
    WHERE completionDate IS NOT NULL AND completionDate != ''
    GROUP BY year, month
    ORDER BY year DESC, month DESC`,
    []
  );
}

export async function insertBooksInBulk(books: Omit<Book, 'id'>[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const book of books) {
      await db.runAsync(
        `INSERT INTO books (coverUri, title, author, publication, actualPrice, discountedPrice, purchasedDate, readingStartDate, completionDate, isSold, soldDate, soldPrice, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          book.coverUri || '',
          book.title,
          book.author,
          book.publication || '',
          book.actualPrice || 0,
          book.discountedPrice || 0,
          sanitize(book.purchasedDate),
          sanitize(book.readingStartDate),
          sanitize(book.completionDate),
          book.isSold ? 1 : 0,
          sanitize(book.soldDate),
          book.soldPrice || 0,
          book.createdAt,
        ]
      );
    }
  });
}
