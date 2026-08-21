import { getDatabase } from './database';
import { Book } from '../types';

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<Book>(
    'SELECT * FROM books ORDER BY createdAt DESC'
  );
  return results.map(row => ({
    ...row,
    isSold: Boolean(row.isSold),
  }));
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Book>(
    'SELECT * FROM books WHERE id = ?',
    [id]
  );
  if (!result) return null;
  return { ...result, isSold: Boolean(result.isSold) };
}

export async function insertBook(book: Omit<Book, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO books (title, author, publication, actualPrice, discountedPrice, purchasedDate, readingStartDate, completionDate, isSold, soldDate, soldPrice, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.title,
      book.author,
      book.publication,
      book.actualPrice,
      book.discountedPrice,
      book.purchasedDate,
      book.readingStartDate,
      book.completionDate,
      book.isSold ? 1 : 0,
      book.soldDate,
      book.soldPrice,
      book.createdAt,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateBook(book: Book): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE books SET title = ?, author = ?, publication = ?, actualPrice = ?, discountedPrice = ?, purchasedDate = ?, readingStartDate = ?, completionDate = ?, isSold = ?, soldDate = ?, soldPrice = ?
     WHERE id = ?`,
    [
      book.title,
      book.author,
      book.publication,
      book.actualPrice,
      book.discountedPrice,
      book.purchasedDate,
      book.readingStartDate,
      book.completionDate,
      book.isSold ? 1 : 0,
      book.soldDate,
      book.soldPrice,
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
  return results.map(row => ({ ...row, isSold: Boolean(row.isSold) }));
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
    WHERE purchasedDate IS NOT NULL
    GROUP BY year, month
    ORDER BY year DESC, month DESC`
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
    WHERE completionDate IS NOT NULL
    GROUP BY year, month
    ORDER BY year DESC, month DESC`
  );
}
