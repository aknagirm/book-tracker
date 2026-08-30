import * as FileSystem from 'expo-file-system/legacy';

const COVERS_RELATIVE = 'covers/';

function coversDir(): string {
  return `${FileSystem.documentDirectory}${COVERS_RELATIVE}`;
}

/**
 * Ensure the covers directory exists.
 */
async function ensureCoversDir(): Promise<void> {
  const dir = coversDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Resolve a stored cover value to a full URI suitable for <Image>.
 *
 * - Relative paths (e.g. "covers/cover_123.jpg") are prefixed with documentDirectory.
 * - Absolute file:// URIs (legacy entries written before this fix) are returned as-is
 *   so old data keeps working until the user re-saves those books.
 * - Null/undefined returns null.
 */
export function resolveCoverUri(storedUri: string | null | undefined): string | null {
  if (!storedUri) return null;
  if (storedUri.startsWith('file://') || storedUri.startsWith('content://')) {
    return storedUri; // legacy absolute URI — use directly
  }
  return `${FileSystem.documentDirectory}${storedUri}`;
}

/**
 * Copy an image from a temporary URI to permanent app storage.
 * Returns a RELATIVE path (e.g. "covers/cover_123.jpg") so it stays
 * valid across app reinstalls where documentDirectory changes.
 * Throws if the copy fails.
 */
export async function saveImagePermanently(tempUri: string): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('documentDirectory is not available');
  }

  await ensureCoversDir();

  const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const relativePath = `${COVERS_RELATIVE}${fileName}`;
  const permanentUri = `${FileSystem.documentDirectory}${relativePath}`;

  await FileSystem.copyAsync({
    from: tempUri,
    to: permanentUri,
  });

  // Verify the copy succeeded
  const info = await FileSystem.getInfoAsync(permanentUri);
  if (!info.exists) {
    throw new Error('Failed to copy image to permanent storage');
  }

  return relativePath; // store relative, not absolute
}

/**
 * Delete a cover image from permanent storage.
 * Accepts either a relative path or a legacy absolute URI.
 */
export async function deleteCoverImage(storedUri: string): Promise<void> {
  try {
    if (!storedUri) return;
    const fullUri = resolveCoverUri(storedUri);
    if (!fullUri) return;
    // Only delete files we own (inside our covers dir)
    const dir = coversDir();
    if (!fullUri.startsWith(dir) && !fullUri.includes('/covers/')) return;
    const info = await FileSystem.getInfoAsync(fullUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fullUri);
    }
  } catch (error) {
    console.error('Error deleting cover image:', error);
  }
}
