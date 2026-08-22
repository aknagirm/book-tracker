import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Book } from '../../src/types';
import { getBooksForStatistics } from '../../src/db/bookQueries';
import { BookCard } from '../../src/components/BookCard';

const titles = {
  purchased: 'Purchased Books',
  completed: 'Completed Books',
  sold: 'Sold Books',
};

export default function StatisticsBooksScreen() {
  const router = useRouter();
  const { metric, startDate, endDate } = useLocalSearchParams<{
    metric: 'purchased' | 'completed' | 'sold';
    startDate: string;
    endDate: string;
  }>();
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (!metric || !startDate || !endDate) return;
    getBooksForStatistics(startDate, endDate, metric).then(setBooks).catch((error) => {
      console.error('Error loading statistics books:', error);
    });
  }, [endDate, metric, startDate]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={metric ? titles[metric] : 'Statistics'} />
      </Appbar.Header>
      <FlatList
        data={books}
        keyExtractor={(book) => book.id.toString()}
        renderItem={({ item }) => <BookCard book={item} onPress={() => router.push(`/book/${item.id}`)} />}
        ListEmptyComponent={<Text style={styles.empty}>No books found in this period.</Text>}
        contentContainerStyle={books.length === 0 ? styles.emptyContainer : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { paddingVertical: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#757575' },
});
