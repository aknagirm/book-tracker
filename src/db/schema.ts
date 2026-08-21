export const CREATE_BOOKS_TABLE = `
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publication TEXT DEFAULT '',
    actualPrice REAL DEFAULT 0,
    discountedPrice REAL DEFAULT 0,
    purchasedDate TEXT,
    readingStartDate TEXT,
    completionDate TEXT,
    isSold INTEGER DEFAULT 0,
    soldDate TEXT,
    soldPrice REAL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`;

export const CREATE_WISHLIST_TABLE = `
  CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publication TEXT DEFAULT '',
    expectedPrice REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    addedDate TEXT NOT NULL
  );
`;
