import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Text, FAB, IconButton, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useWishlist } from '../../src/hooks/useWishlist';
import { EmptyState } from '../../src/components/EmptyState';
import { WishlistBook } from '../../src/types';
import { DatePickerInput } from '../../src/components/DatePickerInput';

export default function WishlistScreen() {
  const { wishlist, loading, refresh, removeFromWishlist, moveToPurchased } = useWishlist();
  const router = useRouter();
  const navigation = useNavigation();
  const [purchaseItem, setPurchaseItem] = useState<WishlistBook | null>(null);
  const [purchasedDate, setPurchasedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [actualPrice, setActualPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Wishlist (${wishlist.length})` });
  }, [navigation, wishlist.length]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
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
    setPurchaseItem(item);
    setPurchasedDate(new Date().toISOString().split('T')[0]);
    setActualPrice(item.expectedPrice > 0 ? item.expectedPrice.toString() : '');
    setDiscountedPrice('');
  };

  const confirmPurchase = async () => {
    if (!purchaseItem || !purchasedDate) return;
    const printed = parseFloat(actualPrice) || 0;
    // Discounted price is the source of truth. If left blank, fall back to printed price.
    const discounted = parseFloat(discountedPrice) || printed;
    await moveToPurchased(
      purchaseItem.id,
      purchasedDate,
      printed,
      discounted
    );
    setPurchaseItem(null);
    refresh();
  };

  const renderItem = ({ item }: { item: WishlistBook }) => (
    <Card style={styles.card} onPress={() => router.push(`/wishlist/edit?id=${item.id}`)}>
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
      <Portal>
        <Dialog visible={purchaseItem !== null} onDismiss={() => setPurchaseItem(null)}>
          <Dialog.Title>Purchase Book</Dialog.Title>
          <Dialog.Content>
            <DatePickerInput label="Purchase Date" value={purchasedDate} onChange={setPurchasedDate} />
            <TextInput
              label="Printed Price (₹)"
              value={actualPrice}
              onChangeText={setActualPrice}
              keyboardType="numeric"
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Discounted Price (₹)"
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              keyboardType="numeric"
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPurchaseItem(null)}>Cancel</Button>
            <Button onPress={confirmPurchase} disabled={!purchasedDate}>Purchase</Button>
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
  dialogInput: {
    marginBottom: 10,
    backgroundColor: 'white',
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
