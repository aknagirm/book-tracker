import * as SQLite from 'expo-sqlite';
import { CREATE_BOOKS_TABLE, CREATE_WISHLIST_TABLE } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('booktracker.db');
    await db.execAsync(CREATE_BOOKS_TABLE);
    await db.execAsync(CREATE_WISHLIST_TABLE);
  } catch (error) {
    console.error('Database initialization error:', error);
    db = null;
    throw error;
  }

  return db;
}
