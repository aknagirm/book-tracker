import { useState, useEffect, useCallback } from 'react';
import { WishlistBook } from '../types';
import { getAllWishlistBooks, insertWishlistBook, deleteWishlistBook, moveWishlistToBooks } from '../db/wishlistQueries';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistBook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllWishlistBooks();
      setWishlist(data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const addToWishlist = async (book: Omit<WishlistBook, 'id'>) => {
    await insertWishlistBook(book);
    await loadWishlist();
  };

  const removeFromWishlist = async (id: number) => {
    await deleteWishlistBook(id);
    await loadWishlist();
  };

  const moveToPurchased = async (id: number) => {
    await moveWishlistToBooks(id);
    await loadWishlist();
  };

  return {
    wishlist,
    loading,
    refresh: loadWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToPurchased,
  };
}
