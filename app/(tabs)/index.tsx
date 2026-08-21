import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Searchbar, FAB, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { BookCard } from '../../src/components/BookCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useBooks } from '../../src/hooks/useBooks';

type Filter = 'all' | 'reading' | 'completed' | 'sold';

export default function BookListScreen() {
  const { books, loading, refresh } = useBooks();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'reading':
        return book.readingStartDate && !book.completionDate && !book.isSold;
      case 'completed':
        return book.completionDate !== null && !book.isSold;
      case 'sold':
        return book.isSold;
      default:
        return true;
    }
  });

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search books..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchbar}
      />
      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'reading', label: 'Reading' },
          { value: 'completed', label: 'Done' },
          { value: 'sold', label: 'Sold' },
        ]}
        style={styles.filters}
      />
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
          />
        )}
        contentContainerStyle={filteredBooks.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="book-open-variant"
            title={loading ? 'Loading...' : 'No books yet'}
            subtitle={loading ? undefined : 'Tap + to add your first book'}
          />
        }
        refreshing={loading}
        onRefresh={refresh}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/book/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filters: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
