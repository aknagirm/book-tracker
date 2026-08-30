import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Appbar, SegmentedButtons, IconButton, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DatePickerInput } from '../../src/components/DatePickerInput';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { useBooks } from '../../src/hooks/useBooks';
import { useWishlist } from '../../src/hooks/useWishlist';
import { saveImagePermanently } from '../../src/utils/imageHelper';

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
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const authorSuggestions = Array.from(new Set([
    ...books.map((book) => book.author),
    ...wishlist.map((book) => book.author),
  ].filter(Boolean))).sort();
  const publisherSuggestions = Array.from(new Set([
    ...books.map((book) => book.publication),
    ...wishlist.map((book) => book.publication),
  ].filter(Boolean))).sort();

  const chooseCoverImage = () => {
    Alert.alert('Add Cover Image', 'Choose an image source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => selectCoverFromCamera() },
      { text: 'Choose from Gallery', onPress: () => selectCoverFromGallery() },
    ]);
  };

  const selectCoverFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  const selectCoverFromCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  const scanCoverEdges = async () => {
    try {
      const { default: DocumentScanner } = await import('react-native-document-scanner-plugin');
      const result = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
      if (result.scannedImages?.length) setCoverUri(result.scannedImages[0]);
    } catch (error) {
      console.error('Error scanning cover edges:', error);
      Alert.alert('Scan Failed', 'Could not detect the book cover edges. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) return;

    setSaving(true);
    try {
      // Save cover image to permanent storage
      let permanentCoverUri: string | null = null;
      if (coverUri) {
        try {
          permanentCoverUri = await saveImagePermanently(coverUri);
        } catch (e) {
          console.error('Error saving cover image:', e);
          // Copy failed; leave permanentCoverUri as null rather than storing a temp URI
        }
      }

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
        const printed = parseFloat(actualPrice) || 0;
        // Discounted price is the source of truth. If left blank, fall back to printed price.
        const discounted = parseFloat(discountedPrice) || printed;
        await addBook({
          title: title.trim(),
          author: author.trim(),
          coverUri: permanentCoverUri,
          publication: publication.trim(),
          actualPrice: printed,
          discountedPrice: discounted,
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
      {bookType === 'purchased' && (
        <>
          <Button mode="outlined" icon="camera-document" onPress={scanCoverEdges} style={styles.scanButton}>
            Scan Cover Edges
          </Button>
          <View style={styles.coverActionRow}>
            <Button mode="outlined" icon="image-plus" onPress={chooseCoverImage} style={styles.coverButton}>
              {coverUri ? 'Change Cover Image' : 'Add Cover Image'}
            </Button>
            {coverUri ? <IconButton icon="close-circle" accessibilityLabel="Remove cover image" onPress={() => setCoverUri(null)} /> : null}
          </View>
          {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverPreview} /> : null}
        </>
      )}
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
                label="Printed Price (₹)"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { flex: 1 },
  formContent: { padding: 16, paddingBottom: 32 },
  input: { marginBottom: 12, backgroundColor: 'white' },
  typeToggle: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  saveButton: { marginTop: 16 },
  scanButton: { marginHorizontal: 16, marginTop: 12 },
  coverActionRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8 },
  coverButton: { flex: 1 },
  coverPreview: { width: 100, height: 150, borderRadius: 6, alignSelf: 'center', marginTop: 12 },
});
