import * as FileSystem from 'expo-file-system';

const COVERS_DIR = `${FileSystem.documentDirectory}covers/`;

/**
 * Ensure the covers directory exists
 */
async function ensureCoversDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(COVERS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
  }
}

/**
 * Copy an image from a temporary URI to permanent app storage.
 * Returns the permanent URI, or null if the source is invalid.
 */
export async function saveImagePermanently(tempUri: string): Promise<string> {
  await ensureCoversDir();

  const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const permanentUri = `${COVERS_DIR}${fileName}`;

  await FileSystem.copyAsync({
    from: tempUri,
    to: permanentUri,
  });

  return permanentUri;
}

/**
 * Delete a cover image from permanent storage.
 */
export async function deleteCoverImage(uri: string): Promise<void> {
  try {
    if (uri && uri.startsWith(COVERS_DIR)) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
      }
    }
  } catch (error) {
    console.error('Error deleting cover image:', error);
  }
}
