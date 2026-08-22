import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Book, WishlistBook } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(val: unknown): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function toNum(val: unknown): number {
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

/** Accept YYYY-MM-DD strings or Excel serial numbers / JS Date objects */
function toDateStr(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;

  // Already a YYYY-MM-DD string
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }

  // Excel serial number (number) or a JS Date produced by SheetJS
  if (typeof val === 'number' || val instanceof Date) {
    const date = val instanceof Date ? val : new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Try parsing a freeform string
  const parsed = new Date(String(val));
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

export async function exportToExcel(
  books: Book[],
  wishlist: WishlistBook[]
): Promise<void> {
  const wb = XLSX.utils.book_new();

  // --- Books sheet ---
  const bookRows = books.map((b) => ({
    Title: b.title,
    Author: b.author,
    Publication: b.publication,
    'Actual Price (₹)': b.actualPrice,
    'Discounted Price (₹)': b.discountedPrice,
    'Purchased Date': b.purchasedDate ?? '',
    'Reading Start Date': b.readingStartDate ?? '',
    'Completion Date': b.completionDate ?? '',
    'Is Sold': b.isSold ? 'Yes' : 'No',
    'Sold Date': b.soldDate ?? '',
    'Sold Price (₹)': b.soldPrice,
  }));

  const booksSheet = XLSX.utils.json_to_sheet(bookRows);
  // Set column widths
  booksSheet['!cols'] = [
    { wch: 35 }, { wch: 22 }, { wch: 20 },
    { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 18 }, { wch: 16 },
    { wch: 8 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, booksSheet, 'Books');

  // --- Wishlist sheet ---
  const wishlistRows = wishlist.map((w) => ({
    Title: w.title,
    Author: w.author,
    Publication: w.publication,
    'Expected Price (₹)': w.expectedPrice,
    Notes: w.notes,
    'Added Date': w.addedDate,
  }));

  const wishlistSheet = XLSX.utils.json_to_sheet(wishlistRows);
  wishlistSheet['!cols'] = [
    { wch: 35 }, { wch: 22 }, { wch: 20 },
    { wch: 18 }, { wch: 30 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wishlistSheet, 'Wishlist');

  // Write workbook to base64
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  // Save to a temp file
  const today = new Date().toISOString().split('T')[0];
  const fileName = `book-tracker-${today}.xlsx`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Book Tracker Data',
    UTI: 'com.microsoft.excel.xlsx',
  });
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

export interface ImportResult {
  books: Omit<Book, 'id'>[];
  wishlist: Omit<WishlistBook, 'id'>[];
  errors: string[];
}

export async function importFromExcel(): Promise<ImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  // Use fetch() to read the file as an ArrayBuffer.
  // FileSystem.readAsStringAsync with Base64 corrupts binary .xlsx files in
  // React Native, so this is the reliable cross-platform approach.
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const wb = XLSX.read(data, { type: 'array', cellDates: true });

  const importedBooks: Omit<Book, 'id'>[] = [];
  const importedWishlist: Omit<WishlistBook, 'id'>[] = [];
  const errors: string[] = [];

  // --- Parse Books sheet ---
  if (wb.SheetNames.includes('Books')) {
    const sheet = wb.Sheets['Books'];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    rows.forEach((row, i) => {
      const title = toStr(row['Title']);
      const author = toStr(row['Author']);
      if (!title || !author) {
        errors.push(`Books row ${i + 2}: Title and Author are required — skipped.`);
        return;
      }
      importedBooks.push({
        title,
        author,
        publication: toStr(row['Publication']),
        actualPrice: toNum(row['Actual Price (₹)']),
        discountedPrice: toNum(row['Discounted Price (₹)']),
        purchasedDate: toDateStr(row['Purchased Date']),
        readingStartDate: toDateStr(row['Reading Start Date']),
        completionDate: toDateStr(row['Completion Date']),
        isSold: toStr(row['Is Sold']).toLowerCase() === 'yes',
        soldDate: toDateStr(row['Sold Date']),
        soldPrice: toNum(row['Sold Price (₹)']),
        createdAt: new Date().toISOString().split('T')[0],
      });
    });
  } else {
    errors.push('No "Books" sheet found — books not imported.');
  }

  // --- Parse Wishlist sheet ---
  if (wb.SheetNames.includes('Wishlist')) {
    const sheet = wb.Sheets['Wishlist'];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    rows.forEach((row, i) => {
      const title = toStr(row['Title']);
      const author = toStr(row['Author']);
      if (!title || !author) {
        errors.push(`Wishlist row ${i + 2}: Title and Author are required — skipped.`);
        return;
      }
      importedWishlist.push({
        title,
        author,
        publication: toStr(row['Publication']),
        expectedPrice: toNum(row['Expected Price (₹)']),
        notes: toStr(row['Notes']),
        addedDate: toDateStr(row['Added Date']) ?? new Date().toISOString().split('T')[0],
      });
    });
  }
  // Wishlist sheet is optional — no error if missing

  return { books: importedBooks, wishlist: importedWishlist, errors };
}
