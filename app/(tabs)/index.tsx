import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Pressable, LayoutAnimation, Animated } from 'react-native';
import { Searchbar, FAB, Appbar, Text } from 'react-native-paper';
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
  const [filterWidth, setFilterWidth] = useState(0);
  const markerPosition = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const filterIndex = ['purchased', 'reading', 'completed', 'sold'].indexOf(filter);

  useEffect(() => {
    if (!filterWidth) return;
    Animated.timing(markerPosition, {
      toValue: filterIndex * (filterWidth / 4),
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [filterIndex, filterWidth, markerPosition]);

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

  const handleFilterChange = (nextFilter: Filter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(nextFilter);
  };

  const bookCounts = {
    purchased: books.filter((book) => !book.readingStartDate && !book.completionDate && !book.isSold).length,
    reading: books.filter((book) => book.readingStartDate && !book.completionDate && !book.isSold).length,
    completed: books.filter((book) => book.completionDate && !book.isSold).length,
    sold: books.filter((book) => book.isSold).length,
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

      <View
        style={styles.filters}
        onLayout={(event) => setFilterWidth(event.nativeEvent.layout.width)}
      >
        {[
          { value: 'purchased', label: 'Purchased', count: bookCounts.purchased },
          { value: 'reading', label: 'Reading', count: bookCounts.reading },
          { value: 'completed', label: 'Done', count: bookCounts.completed },
          { value: 'sold', label: 'Sold', count: bookCounts.sold },
        ].map((button) => {
          const selected = filter === button.value;
          return (
            <Pressable
              key={button.value}
              onPress={() => handleFilterChange(button.value as Filter)}
              style={styles.filterButton}
            >
              <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                {button.label} ({button.count})
              </Text>
            </Pressable>
          );
        })}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectedFilterButton,
            {
              width: filterWidth / 4,
              transform: [{ translateX: markerPosition }],
            },
          ]}
        />
      </View>
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
    flexDirection: 'row',
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderColor: '#6750A4',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  selectedFilterButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#6750A4',
    zIndex: 0,
  },
  filterText: {
    color: '#6750A4',
    fontSize: 13,
  },
  selectedFilterText: {
    color: '#ffffff',
    fontWeight: '600',
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
