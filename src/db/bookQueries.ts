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

export async function startReading(id: number, readingStartDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE books SET readingStartDate = ?, completionDate = '' WHERE id = ?",
    [readingStartDate, id]
  );
}

export async function completeReading(id: number, completionDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE books SET completionDate = ? WHERE id = ?',
    [completionDate, id]
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
      SUM(COALESCE(discountedPrice, 0)) as totalSpent
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

export async function getStatisticsSummary(
  startDate: string,
  endDate: string
): Promise<import('../types').StatisticsSummary> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<import('../types').StatisticsSummary>(
    `SELECT
      COUNT(CASE WHEN purchasedDate BETWEEN ? AND ? THEN 1 END) as ownedCount,
      COUNT(CASE WHEN completionDate BETWEEN ? AND ? THEN 1 END) as completedCount,
      COUNT(CASE WHEN isSold = 1 AND soldDate BETWEEN ? AND ? THEN 1 END) as soldCount,
      COALESCE(SUM(CASE WHEN purchasedDate BETWEEN ? AND ? THEN COALESCE(discountedPrice, 0) ELSE 0 END), 0) as totalSpent,
      COALESCE(SUM(CASE WHEN isSold = 1 AND soldDate BETWEEN ? AND ? THEN COALESCE(soldPrice, 0) ELSE 0 END), 0) as totalEarnings
    FROM books`,
    [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]
  );

  const summary = result || {
    ownedCount: 0,
    completedCount: 0,
    soldCount: 0,
    totalSpent: 0,
    totalEarnings: 0,
  };
  const monthlyRows = await db.getAllAsync<{
    month: number;
    purchasedCount: number;
    completedCount: number;
    soldCount: number;
    totalSpent: number;
    totalEarnings: number;
  }>(
    `SELECT month,
      SUM(purchasedCount) as purchasedCount,
      SUM(completedCount) as completedCount,
      SUM(soldCount) as soldCount,
      SUM(totalSpent) as totalSpent,
      SUM(totalEarnings) as totalEarnings
    FROM (
      SELECT CAST(strftime('%m', purchasedDate) AS INTEGER) as month, COUNT(*) as purchasedCount, 0 as completedCount, 0 as soldCount,
        SUM(COALESCE(discountedPrice, 0)) as totalSpent, 0 as totalEarnings
      FROM books WHERE purchasedDate BETWEEN ? AND ? GROUP BY month
      UNION ALL
      SELECT CAST(strftime('%m', completionDate) AS INTEGER), 0, COUNT(*), 0, 0, 0
      FROM books WHERE completionDate BETWEEN ? AND ? GROUP BY 1
      UNION ALL
      SELECT CAST(strftime('%m', soldDate) AS INTEGER), 0, 0, COUNT(*), 0,
        SUM(COALESCE(soldPrice, 0))
      FROM books WHERE isSold = 1 AND soldDate BETWEEN ? AND ? GROUP BY 1
    ) GROUP BY month ORDER BY month ASC`,
    [startDate, endDate, startDate, endDate, startDate, endDate]
  );
  return {
    ...summary,
    netSpent: summary.totalSpent - summary.totalEarnings,
    monthly: monthlyRows.map((row) => ({
      month: row.month,
      purchasedCount: row.purchasedCount || 0,
      completedCount: row.completedCount || 0,
      soldCount: row.soldCount || 0,
      netSpent: (row.totalSpent || 0) - (row.totalEarnings || 0),
    })),
  };
}

export async function getBooksForStatistics(
  startDate: string,
  endDate: string,
  metric: 'purchased' | 'completed' | 'sold'
): Promise<Book[]> {
  const db = await getDatabase();
  const condition = metric === 'purchased'
    ? 'purchasedDate BETWEEN ? AND ?'
    : metric === 'completed'
      ? 'completionDate BETWEEN ? AND ?'
      : 'isSold = 1 AND soldDate BETWEEN ? AND ?';
  const rows = await db.getAllAsync<Book>(`SELECT * FROM books WHERE ${condition} ORDER BY purchasedDate DESC`, [startDate, endDate]);
  return rows.map(row => ({
    ...row,
    isSold: Boolean(row.isSold),
    purchasedDate: row.purchasedDate || null,
    readingStartDate: row.readingStartDate || null,
    completionDate: row.completionDate || null,
    soldDate: row.soldDate || null,
  }));
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
