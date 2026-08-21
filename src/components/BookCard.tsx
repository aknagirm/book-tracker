import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { Book } from '../types';

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
  const price = book.discountedPrice > 0 ? book.discountedPrice : book.actualPrice;

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
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
        <Chip
          compact
          style={[styles.chip, { backgroundColor: status.color + '20' }]}
          textStyle={{ color: status.color, fontSize: 11 }}
        >
          {status.label}
        </Chip>
        {price > 0 && (
          <Text variant="labelMedium" style={styles.price}>
            ₹{price.toFixed(0)}
          </Text>
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
  title: {
    fontWeight: '600',
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
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  price: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#616161',
  },
});
