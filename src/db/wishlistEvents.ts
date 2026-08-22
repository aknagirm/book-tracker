type WishlistChangeListener = () => void;

const listeners = new Set<WishlistChangeListener>();

export function subscribeToWishlistChanges(listener: WishlistChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyWishlistChanged(): void {
  listeners.forEach((listener) => listener());
}
