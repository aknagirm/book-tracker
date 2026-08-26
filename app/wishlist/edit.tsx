import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Appbar, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { useWishlist } from '../../src/hooks/useWishlist';
import { useBooks } from '../../src/hooks/useBooks';
import { getWishlistBookById } from '../../src/db/wishlistQueries';
import { WishlistBook } from '../../src/types';

export default function EditWishlistScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books } = useBooks();
  const { wishlist, editWishlistBook } = useWishlist();

  const [item, setItem] = useState<WishlistBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const authorSuggestions = Array.from(new Set([
    ...books.map((b) => b.author),
    ...wishlist.map((b) => b.author),
  ].filter(Boolean))).sort();

  const publisherSuggestions = Array.from(new Set([
    ...books.map((b) => b.publication),
    ...wishlist.map((b) => b.publication),
  ].filter(Boolean))).sort();

  useEffect(() => {
    (async () => {
      try {
        const data = await getWishlistBookById(Number(id));
        if (data) {
          setItem(data);
          setTitle(data.title);
          setAuthor(data.author);
          setPublication(data.publication);
          setExpectedPrice(data.expectedPrice > 0 ? data.expectedPrice.toString() : '');
          setNotes(data.notes);
        }
      } catch (error) {
        console.error('Error loading wishlist item:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !author.trim() || !item) return;

    setSaving(true);
    try {
      await editWishlistBook({
        ...item,
        title: title.trim(),
        author: author.trim(),
        publication: publication.trim(),
        expectedPrice: parseFloat(expectedPrice) || 0,
        notes: notes.trim(),
      });
      router.back();
    } catch (error) {
      console.error('Error updating wishlist item:', error);
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
        <Appbar.Content title="Edit Wishlist Item" />
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
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!title.trim() || !author.trim() || saving}
          style={styles.saveButton}
        >
          Update
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
  saveButton: {
    marginTop: 16,
  },
});
