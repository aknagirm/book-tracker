import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { TextInput, Button, Appbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DatePickerInput } from '../../src/components/DatePickerInput';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { useBooks } from '../../src/hooks/useBooks';
import { useWishlist } from '../../src/hooks/useWishlist';

type BookType = 'purchased' | 'wishlist';

export default function AddBookScreen() {
  const router = useRouter();
  const { books, addBook } = useBooks();
  const { wishlist, addToWishlist } = useWishlist();

  const [bookType, setBookType] = useState<BookType>('purchased');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [purchasedDate, setPurchasedDate] = useState<string | null>(null);
  const [readingStartDate, setReadingStartDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [expectedPrice, setExpectedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const authorSuggestions = Array.from(new Set([
    ...books.map((book) => book.author),
    ...wishlist.map((book) => book.author),
  ].filter(Boolean))).sort();
  const publisherSuggestions = Array.from(new Set([
    ...books.map((book) => book.publication),
    ...wishlist.map((book) => book.publication),
  ].filter(Boolean))).sort();

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'Allow camera access to scan a book barcode.');
        return;
      }
    }
    setScanning(true);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    const isbnMatch = data.match(/(?:97[89]\d{10}|\d{9}[\dX])/i);
    const isbn = isbnMatch?.[0] ?? '';
    if (!/^(?:\d{10}|\d{13})$/i.test(isbn)) {
      Alert.alert('Unsupported Barcode', 'Please scan an ISBN-10 or ISBN-13 book barcode.');
      setScanning(true);
      return;
    }

    try {
      const openLibraryResponse = await fetch(
        `https://openlibrary.org/search.json?isbn=${isbn}&limit=1`
      );
      const openLibraryResult = openLibraryResponse.ok
        ? await openLibraryResponse.json()
        : null;
      const openLibraryBook = openLibraryResult?.docs?.[0];

      let title = openLibraryBook?.title;
      let authors = openLibraryBook?.author_name;
      let publisher = openLibraryBook?.publisher?.[0];

      if (!title || !authors?.length || !publisher) {
        const googleResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const googleResult = googleResponse.ok ? await googleResponse.json() : null;
        const googleBook = googleResult?.items?.[0]?.volumeInfo;
        title = title || googleBook?.title;
        authors = authors?.length ? authors : googleBook?.authors;
        publisher = publisher || googleBook?.publisher;
      }

      if (!title) throw new Error('Book not found');

      setTitle(title);
      setAuthor(authors?.join(', ') || '');
      setPublication(publisher || '');
      setScannerVisible(false);

      if (!authors?.length) {
        Alert.alert('Partial Details Found', 'Some book details were not available. Please complete them manually.');
      }
    } catch {
      Alert.alert('Book Not Found', `No details were found for ISBN ${isbn}. You can enter the book manually.`);
      setScanning(true);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) return;

    setSaving(true);
    try {
      if (bookType === 'wishlist') {
        await addToWishlist({
          title: title.trim(),
          author: author.trim(),
          publication: publication.trim(),
          expectedPrice: parseFloat(expectedPrice) || 0,
          notes: notes.trim(),
          addedDate: new Date().toISOString().split('T')[0],
        });
      } else {
        await addBook({
          title: title.trim(),
          author: author.trim(),
          coverUri,
          publication: publication.trim(),
          actualPrice: parseFloat(actualPrice) || 0,
          discountedPrice: parseFloat(discountedPrice) || 0,
          purchasedDate,
          readingStartDate,
          completionDate,
          isSold: false,
          soldDate: null,
          soldPrice: 0,
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
      router.back();
    } catch (error) {
      console.error('Error saving book:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Book" />
      </Appbar.Header>
      <Button
        mode="outlined"
        icon="barcode-scan"
        onPress={openScanner}
        style={styles.scanButton}
      >
        Scan ISBN Barcode
      </Button>
      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <TextInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />
        <AutocompleteInput
          label="Author *"
          value={author}
          onChangeText={setAuthor}
          suggestions={authorSuggestions}
        />
        <AutocompleteInput
          label="Publisher"
          value={publication}
          onChangeText={setPublication}
          suggestions={publisherSuggestions}
        />

        <SegmentedButtons
          value={bookType}
          onValueChange={(value) => setBookType(value as BookType)}
          buttons={[
            { value: 'purchased', label: 'Purchased' },
            { value: 'wishlist', label: 'Wishlist' },
          ]}
          style={styles.typeToggle}
        />

        {bookType === 'purchased' && (
          <>
            <View style={styles.row}>
              <TextInput
                label="Actual Price (₹)"
                value={actualPrice}
                onChangeText={setActualPrice}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Discounted Price (₹)"
                value={discountedPrice}
                onChangeText={setDiscountedPrice}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>
            <DatePickerInput
              label="Purchased Date"
              value={purchasedDate}
              onChange={setPurchasedDate}
            />
            <DatePickerInput
              label="Reading Start Date"
              value={readingStartDate}
              onChange={setReadingStartDate}
            />
            <DatePickerInput
              label="Completion Date"
              value={completionDate}
              onChange={setCompletionDate}
            />
          </>
        )}

        {bookType === 'wishlist' && (
          <>
            <TextInput
              label="Expected Price (₹)"
              value={expectedPrice}
              onChangeText={setExpectedPrice}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!title.trim() || !author.trim() || saving}
          style={styles.saveButton}
        >
          {bookType === 'wishlist' ? 'Add to Wishlist' : 'Save Book'}
        </Button>
      </ScrollView>

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => setScannerVisible(false)} />
            <Appbar.Content title="Scan ISBN Barcode" />
          </Appbar.Header>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'code39', 'code128', 'qr', 'datamatrix'],
            }}
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
          >
            <View style={styles.scanFrame} />
          </CameraView>
          <Button mode="outlined" onPress={() => setScannerVisible(false)} style={styles.cancelScanButton}>
            Cancel
          </Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  typeToggle: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: 16,
  },
  scanButton: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '80%',
    height: 160,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
  cancelScanButton: {
    margin: 16,
    backgroundColor: '#ffffff',
  },
});
