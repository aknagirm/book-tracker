import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Appbar, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DatePickerInput } from '../../src/components/DatePickerInput';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { useBook, useBooks } from '../../src/hooks/useBooks';

export default function EditBookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading } = useBook(Number(id));
  const { books, editBook } = useBooks();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [purchasedDate, setPurchasedDate] = useState<string | null>(null);
  const [readingStartDate, setReadingStartDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const authorSuggestions = Array.from(new Set(books.map((item) => item.author).filter(Boolean))).sort();
  const publisherSuggestions = Array.from(new Set(books.map((item) => item.publication).filter(Boolean))).sort();

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setPublication(book.publication);
      setActualPrice(book.actualPrice > 0 ? book.actualPrice.toString() : '');
      setDiscountedPrice(book.discountedPrice > 0 ? book.discountedPrice.toString() : '');
      setPurchasedDate(book.purchasedDate);
      setReadingStartDate(book.readingStartDate);
      setCompletionDate(book.completionDate);
      setCoverUri(book.coverUri || null);
    }
  }, [book]);

  const chooseCoverImage = () => {
    Alert.alert('Change Cover Image', 'Choose an image source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: selectCoverFromCamera },
      { text: 'Choose from Gallery', onPress: selectCoverFromGallery },
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
    if (!title.trim() || !author.trim() || !book) return;

    setSaving(true);
    try {
      await editBook({
        ...book,
        title: title.trim(),
        author: author.trim(),
        publication: publication.trim(),
        actualPrice: parseFloat(actualPrice) || 0,
        discountedPrice: parseFloat(discountedPrice) || 0,
        purchasedDate,
        readingStartDate,
        completionDate,
        coverUri,
      });
      router.back();
    } catch (error) {
      console.error('Error updating book:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Book" />
      </Appbar.Header>
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
        <View style={styles.coverActionRow}>
          <Button mode="outlined" icon="camera-document" onPress={scanCoverEdges} style={styles.coverButton}>
            Scan Cover Edges
          </Button>
          <Button mode="outlined" icon="image-edit" onPress={chooseCoverImage} style={styles.coverButton}>
            {coverUri ? 'Change Cover Image' : 'Add Cover Image'}
          </Button>
          {coverUri ? (
            <IconButton
              icon="close-circle"
              accessibilityLabel="Remove cover image"
              onPress={() => setCoverUri(null)}
            />
          ) : null}
        </View>
        {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverPreview} /> : null}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!title.trim() || !author.trim() || saving}
          style={styles.saveButton}
        >
          Update Book
        </Button>
      </ScrollView>
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
  coverActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  coverButton: {
    flex: 1,
  },
  coverPreview: {
    width: 100,
    height: 150,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 12,
  },
});
