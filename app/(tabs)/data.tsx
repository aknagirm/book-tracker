import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { exportToExcel, importFromExcel, ImportResult } from '../../src/utils/excelImportExport';
import { useBooks } from '../../src/hooks/useBooks';
import { useWishlist } from '../../src/hooks/useWishlist';
import { insertBooksInBulk } from '../../src/db/bookQueries';
import { insertWishlistBooksInBulk } from '../../src/db/wishlistQueries';

export default function DataScreen() {
  const { books, refresh: refreshBooks } = useBooks();
  const { wishlist, refresh: refreshWishlist } = useWishlist();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshBooks();
      refreshWishlist();
    }, [])
  );

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------
  const handleExport = async () => {
    if (books.length === 0 && wishlist.length === 0) {
      Alert.alert('Nothing to Export', 'Add some books first before exporting.');
      return;
    }
    setExporting(true);
    try {
      await exportToExcel(books, wishlist);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Failed', message);
    } finally {
      setExporting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------
  const handleImport = async () => {
    setImporting(true);
    let result: ImportResult | null = null;
    try {
      result = await importFromExcel();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not read file.';
      Alert.alert('Import Failed', message);
      setImporting(false);
      return;
    }

    if (!result) {
      // User cancelled the picker
      setImporting(false);
      return;
    }

    const { books: newBooks, wishlist: newWishlist, errors } = result;
    const totalRows = newBooks.length + newWishlist.length;

    if (totalRows === 0 && errors.length > 0) {
      Alert.alert(
        'Import Failed',
        'No valid rows found.\n\n' + errors.join('\n')
      );
      setImporting(false);
      return;
    }

    // Build confirmation message
    const lines: string[] = [];
    if (newBooks.length > 0) lines.push(`• ${newBooks.length} book(s) from "Books" sheet`);
    if (newWishlist.length > 0) lines.push(`• ${newWishlist.length} item(s) from "Wishlist" sheet`);
    if (errors.length > 0) lines.push(`\n⚠️ ${errors.length} row(s) skipped:\n${errors.join('\n')}`);

    Alert.alert(
      'Confirm Import',
      `This will ADD the following to your existing data:\n\n${lines.join('\n')}\n\nExisting records will NOT be deleted.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setImporting(false) },
        {
          text: 'Import',
          onPress: async () => {
            try {
              if (newBooks.length > 0) await insertBooksInBulk(newBooks);
              if (newWishlist.length > 0) await insertWishlistBooksInBulk(newWishlist);
              await refreshBooks();
              await refreshWishlist();
              Alert.alert(
                'Import Complete',
                `Successfully imported ${newBooks.length} book(s) and ${newWishlist.length} wishlist item(s).`
              );
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Database error.';
              Alert.alert('Import Failed', message);
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const isLoading = exporting || importing;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Current Data
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Books</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {books.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">Wishlist items</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {wishlist.length}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Export */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Export
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.description}>
            Save all your books and wishlist to an Excel file (.xlsx). You can
            open it in Google Sheets, Microsoft Excel, or any spreadsheet app.
          </Text>
          <Button
            mode="contained"
            icon="microsoft-excel"
            onPress={handleExport}
            loading={exporting}
            disabled={isLoading}
            style={styles.button}
          >
            Export to Excel
          </Button>
        </Card.Content>
      </Card>

      {/* Import */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Import
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.description}>
            Load books from an Excel file. The file must have a{' '}
            <Text style={styles.mono}>Books</Text> sheet and/or a{' '}
            <Text style={styles.mono}>Wishlist</Text> sheet with the correct
            column headers. Imported records are added to your existing data —
            nothing is deleted.
          </Text>
          <Button
            mode="outlined"
            icon="file-upload-outline"
            onPress={handleImport}
            loading={importing}
            disabled={isLoading}
            style={styles.button}
          >
            Import from Excel
          </Button>
        </Card.Content>
      </Card>

      {/* Format guide */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Expected Excel Format
          </Text>
          <Divider style={styles.divider} />

          <Text variant="labelLarge" style={styles.sheetLabel}>
            "Books" sheet columns
          </Text>
          {[
            'Title *',
            'Author *',
            'Publication',
            'Printed Price (₹)',
            'Discounted Price (₹)',
            'Purchased Date',
            'Reading Start Date',
            'Completion Date',
            'Is Sold   (Yes / No)',
            'Sold Date',
            'Sold Price (₹)',
          ].map((col) => (
            <Text key={col} variant="bodySmall" style={styles.colItem}>
              • {col}
            </Text>
          ))}

          <Text variant="labelLarge" style={[styles.sheetLabel, { marginTop: 12 }]}>
            "Wishlist" sheet columns
          </Text>
          {[
            'Title *',
            'Author *',
            'Publication',
            'Expected Price (₹)',
            'Notes',
            'Added Date',
          ].map((col) => (
            <Text key={col} variant="bodySmall" style={styles.colItem}>
              • {col}
            </Text>
          ))}

          <Text variant="bodySmall" style={styles.note}>
            * Required. Dates must be in YYYY-MM-DD format or a standard Excel
            date cell.
          </Text>
        </Card.Content>
      </Card>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  divider: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statValue: {
    fontWeight: '600',
    color: '#6750A4',
  },
  description: {
    color: '#616161',
    lineHeight: 20,
    marginBottom: 14,
  },
  button: {
    marginTop: 4,
  },
  sheetLabel: {
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  colItem: {
    color: '#616161',
    lineHeight: 22,
  },
  mono: {
    fontFamily: 'monospace',
    color: '#6750A4',
  },
  note: {
    marginTop: 12,
    color: '#9e9e9e',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
