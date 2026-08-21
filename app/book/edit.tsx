import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Appbar, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DatePickerInput } from '../../src/components/DatePickerInput';
import { useBook, useBooks } from '../../src/hooks/useBooks';

export default function EditBookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading } = useBook(Number(id));
  const { editBook } = useBooks();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [purchasedDate, setPurchasedDate] = useState<string | null>(null);
  const [readingStartDate, setReadingStartDate] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    }
  }, [book]);

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
        <TextInput
          label="Author *"
          value={author}
          onChangeText={setAuthor}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Publication"
          value={publication}
          onChangeText={setPublication}
          mode="outlined"
          style={styles.input}
        />
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
});
