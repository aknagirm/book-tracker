import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Text, Appbar, Card, Button, Chip, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useBook, useBooks } from '../../src/hooks/useBooks';
import { DatePickerInput } from '../../src/components/DatePickerInput';

export default function BookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading, refresh } = useBook(Number(id));
  const { removeBook, markAsSold } = useBooks();

  const [sellDialogVisible, setSellDialogVisible] = useState(false);
  const [soldDate, setSoldDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [soldPrice, setSoldPrice] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeBook(Number(id));
            router.back();
          },
        },
      ]
    );
  };

  const handleSell = async () => {
    if (!soldDate || !soldPrice) return;
    await markAsSold(Number(id), soldDate, parseFloat(soldPrice));
    setSellDialogVisible(false);
    refresh();
  };

  if (loading || !book) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Book Details" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  const getStatus = () => {
    if (book.isSold) return { label: 'Sold', color: '#f44336' };
    if (book.completionDate) return { label: 'Completed', color: '#4caf50' };
    if (book.readingStartDate) return { label: 'Reading', color: '#ff9800' };
    return { label: 'Purchased', color: '#2196f3' };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Book Details" />
        <Appbar.Action icon="pencil" onPress={() => router.push(`/book/edit?id=${book.id}`)} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {book.coverUri ? (
              <Image source={{ uri: book.coverUri }} style={styles.cover} />
            ) : null}
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.title}>
                {book.title}
              </Text>
              <Chip
                style={{ backgroundColor: status.color + '20' }}
                textStyle={{ color: status.color }}
              >
                {status.label}
              </Chip>
            </View>
            <Text variant="titleMedium" style={styles.author}>
              by {book.author}
            </Text>
            {book.publication ? (
              <Text variant="bodyMedium" style={styles.publication}>
                Publisher: {book.publication}
              </Text>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Price Details</Text>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Actual Price</Text>
              <Text variant="bodyMedium" style={styles.value}>₹{book.actualPrice.toFixed(0)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">Discounted Price</Text>
              <Text variant="bodyMedium" style={[styles.value, { color: '#4caf50' }]}>
                ₹{book.discountedPrice.toFixed(0)}
              </Text>
            </View>
            {book.discountedPrice > 0 && book.actualPrice > book.discountedPrice && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">You Saved</Text>
                <Text variant="bodyMedium" style={[styles.value, { color: '#4caf50' }]}>
                  ₹{(book.actualPrice - book.discountedPrice).toFixed(0)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Dates</Text>
            <Divider style={styles.divider} />
            {book.purchasedDate && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Purchased</Text>
                <Text variant="bodyMedium" style={styles.value}>{book.purchasedDate}</Text>
              </View>
            )}
            {book.readingStartDate && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Started Reading</Text>
                <Text variant="bodyMedium" style={styles.value}>{book.readingStartDate}</Text>
              </View>
            )}
            {book.completionDate && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Completed</Text>
                <Text variant="bodyMedium" style={styles.value}>{book.completionDate}</Text>
              </View>
            )}
            {!book.purchasedDate && !book.readingStartDate && !book.completionDate && (
              <Text variant="bodyMedium" style={{ color: '#9e9e9e' }}>No dates recorded</Text>
            )}
          </Card.Content>
        </Card>

        {book.isSold && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>Sale Details</Text>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Sold Date</Text>
                <Text variant="bodyMedium" style={styles.value}>{book.soldDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium">Sold Price</Text>
                <Text variant="bodyMedium" style={styles.value}>₹{book.soldPrice.toFixed(0)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {!book.isSold && (
          <Button
            mode="outlined"
            icon="tag"
            onPress={() => setSellDialogVisible(true)}
            style={styles.sellButton}
          >
            Mark as Sold
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={sellDialogVisible} onDismiss={() => setSellDialogVisible(false)}>
          <Dialog.Title>Sell Book</Dialog.Title>
          <Dialog.Content>
            <DatePickerInput
              label="Sold Date"
              value={soldDate}
              onChange={setSoldDate}
            />
            <TextInput
              label="Sold Price (₹)"
              value={soldPrice}
              onChangeText={setSoldPrice}
              keyboardType="numeric"
              mode="outlined"
              style={{ backgroundColor: 'white' }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSellDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSell} disabled={!soldDate || !soldPrice}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
  },
  cover: {
    width: 160,
    height: 220,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 16,
  },
  author: {
    marginTop: 4,
    color: '#616161',
  },
  publication: {
    marginTop: 4,
    color: '#9e9e9e',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  divider: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  value: {
    fontWeight: '500',
  },
  sellButton: {
    marginVertical: 16,
  },
});
