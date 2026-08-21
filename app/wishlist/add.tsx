import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useWishlist } from '../../src/hooks/useWishlist';

export default function AddWishlistScreen() {
  const router = useRouter();
  const { addToWishlist } = useWishlist();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) return;

    setSaving(true);
    try {
      await addToWishlist({
        title: title.trim(),
        author: author.trim(),
        publication: publication.trim(),
        expectedPrice: parseFloat(expectedPrice) || 0,
        notes: notes.trim(),
        addedDate: new Date().toISOString().split('T')[0],
      });
      router.back();
    } catch (error) {
      console.error('Error saving wishlist item:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add to Wishlist" />
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
          Add to Wishlist
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
