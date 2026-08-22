import { useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { getAllBooks, getBookById, insertBook, updateBook, deleteBook, sellBook, startReading, completeReading } from '../db/bookQueries';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllBooks();
      setBooks(data);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const addBook = async (book: Omit<Book, 'id'>) => {
    await insertBook(book);
    await loadBooks();
  };

  const editBook = async (book: Book) => {
    await updateBook(book);
    await loadBooks();
  };

  const removeBook = async (id: number) => {
    await deleteBook(id);
    await loadBooks();
  };

  const markAsSold = async (id: number, soldDate: string, soldPrice: number) => {
    await sellBook(id, soldDate, soldPrice);
    await loadBooks();
  };

  const markAsReading = async (id: number, readingStartDate: string) => {
    await startReading(id, readingStartDate);
    await loadBooks();
  };

  const markAsCompleted = async (id: number, completionDate: string) => {
    await completeReading(id, completionDate);
    await loadBooks();
  };

  return {
    books,
    loading,
    refresh: loadBooks,
    addBook,
    editBook,
    removeBook,
    markAsSold,
    markAsReading,
    markAsCompleted,
  };
}

export function useBook(id: number) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBookById(id);
      setBook(data);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  return { book, loading, refresh: loadBook };
}
