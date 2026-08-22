import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Searchbar, FAB, SegmentedButtons, IconButton, Appbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { BookCard } from '../../src/components/BookCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useBooks } from '../../src/hooks/useBooks';

type Filter = 'purchased' | 'reading' | 'completed' | 'sold';

export default function BookListScreen() {
  const { books, loading, refresh } = useBooks();
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filter, setFilter] = useState<Filter>('purchased');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const filteredBooks = books
    .filter(book => {
      const normalizedSearch = search.toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(normalizedSearch) ||
        book.author.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      switch (filter) {
        case 'reading':
          return book.readingStartDate && !book.completionDate && !book.isSold;
        case 'completed':
          return book.completionDate !== null && !book.isSold;
        case 'sold':
          return book.isSold;
        case 'purchased':
          return !book.readingStartDate && !book.completionDate && !book.isSold;
      }
    })
    .sort((firstBook, secondBook) => {
      const firstDate = firstBook.purchasedDate || firstBook.createdAt;
      const secondDate = secondBook.purchasedDate || secondBook.createdAt;
      return secondDate.localeCompare(firstDate);
    });

  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Books" />
        <Appbar.Action
          icon="magnify"
          onPress={() => setSearchVisible(!searchVisible)}
        />
      </Appbar.Header>

      {searchVisible && (
        <Searchbar
          placeholder="Search books..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchbar}
          autoFocus
          onIconPress={handleSearchClose}
          icon="arrow-left"
        />
      )}

      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
        buttons={[
          { value: 'purchased', label: 'Purchased' },
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
    marginHorizontal: 16,
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
