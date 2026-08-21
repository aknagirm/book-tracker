import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Text, FAB, IconButton } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useWishlist } from '../../src/hooks/useWishlist';
import { EmptyState } from '../../src/components/EmptyState';
import { WishlistBook } from '../../src/types';

export default function WishlistScreen() {
  const { wishlist, loading, refresh, removeFromWishlist, moveToPurchased } = useWishlist();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const handleRemove = (item: WishlistBook) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove "${item.title}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWishlist(item.id),
        },
      ]
    );
  };

  const handleMoveToPurchased = (item: WishlistBook) => {
    Alert.alert(
      'Mark as Purchased',
      `Move "${item.title}" to your book collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Purchased',
          onPress: async () => {
            await moveToPurchased(item.id);
            refresh();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: WishlistBook }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={styles.author}>
            {item.author}
          </Text>
          {item.publication ? (
            <Text variant="bodySmall" style={styles.publication}>
              {item.publication}
            </Text>
          ) : null}
          {item.expectedPrice > 0 && (
            <Text variant="labelMedium" style={styles.price}>
              ₹{item.expectedPrice.toFixed(0)}
            </Text>
          )}
          {item.notes ? (
            <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="cart-arrow-down"
            size={20}
            onPress={() => handleMoveToPurchased(item)}
          />
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => handleRemove(item)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={wishlist.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title={loading ? 'Loading...' : 'Wishlist is empty'}
            subtitle={loading ? undefined : 'Tap + to add books you want to read'}
          />
        }
        refreshing={loading}
        onRefresh={refresh}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/wishlist/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
  },
  card: {
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  author: {
    color: '#616161',
    marginTop: 2,
  },
  publication: {
    color: '#9e9e9e',
    marginTop: 2,
  },
  price: {
    color: '#2196f3',
    marginTop: 4,
  },
  notes: {
    color: '#757575',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'column',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
