import * as SQLite from 'expo-sqlite';
import { CREATE_BOOKS_TABLE, CREATE_WISHLIST_TABLE } from './schema';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const database = await SQLite.openDatabaseAsync('booktracker.db');
      await database.execAsync(CREATE_BOOKS_TABLE);
      await database.execAsync(CREATE_WISHLIST_TABLE);
      await database.execAsync('ALTER TABLE books ADD COLUMN coverUri TEXT;').catch(() => undefined);
      db = database;
      return database;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  })();

  try {
    return await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}
