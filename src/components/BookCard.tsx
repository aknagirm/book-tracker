import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { Book } from '../types';
import { resolveCoverUri } from '../utils/imageHelper';

interface Props {
  book: Book;
  onPress: () => void;
}

export function BookCard({ book, onPress }: Props) {
  const theme = useTheme();

  const getStatus = () => {
    if (book.isSold) return { label: 'Sold', color: '#f44336' };
    if (book.completionDate) return { label: 'Completed', color: '#4caf50' };
    if (book.readingStartDate) return { label: 'Reading', color: '#ff9800' };
    return { label: 'Purchased', color: '#2196f3' };
  };

  const status = getStatus();
  const price = book.discountedPrice;

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={1} style={styles.title}>
            {book.title}
          </Text>
          <Text variant="bodyMedium" style={styles.author}>
            {book.author}
          </Text>
          {book.publication ? (
            <Text variant="bodySmall" style={styles.publication}>
              {book.publication}
            </Text>
          ) : null}
          <View style={styles.statusRow}>
            <Chip
              compact
              style={[styles.chip, { backgroundColor: status.color + '20' }]}
              textStyle={{ color: status.color, fontSize: 11 }}
            >
              {status.label}
            </Chip>
            <Text variant="labelMedium" style={styles.price}>
              ₹{price.toFixed(0)}
            </Text>
          </View>
        </View>
        {book.coverUri ? (
          <Image source={{ uri: resolveCoverUri(book.coverUri) ?? book.coverUri }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text variant="labelSmall" style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  cover: {
    width: 72,
    height: 96,
    borderRadius: 4,
    marginBottom: 8,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eeeeee',
    borderColor: '#d5d5d5',
    borderWidth: 1,
  },
  placeholderText: {
    color: '#757575',
  },
  author: {
    color: '#616161',
    marginTop: 2,
  },
  publication: {
    color: '#9e9e9e',
    marginTop: 2,
  },
  chip: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    color: '#616161',
    fontWeight: '600',
  },
});
