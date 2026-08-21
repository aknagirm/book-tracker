import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useStatistics } from '../../src/hooks/useStatistics';
import { EmptyState } from '../../src/components/EmptyState';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function StatisticsScreen() {
  const { stats, loading, refresh } = useStatistics();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  if (!loading && stats.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="chart-bar"
          title="No statistics yet"
          subtitle="Add books with dates to see your reading statistics"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {stats.map((yearData) => (
        <Card key={yearData.year} style={styles.yearCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.yearTitle}>
              {yearData.year}
            </Text>
            <View style={styles.yearSummary}>
              <View style={styles.statBox}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {yearData.purchasedCount}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>Purchased</Text>
              </View>
              <View style={styles.statBox}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4caf50' }]}>
                  {yearData.completedCount}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#ff9800' }]}>
                  ₹{yearData.totalSpent.toFixed(0)}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>Spent</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {yearData.months.map((month) => (
              <View key={`${yearData.year}-${month.month}`} style={styles.monthRow}>
                <Text variant="bodyMedium" style={styles.monthName}>
                  {MONTH_NAMES[month.month]}
                </Text>
                <View style={styles.monthStats}>
                  {month.purchasedCount > 0 && (
                    <Text variant="bodySmall" style={styles.monthStat}>
                      {month.purchasedCount} bought
                    </Text>
                  )}
                  {month.completedCount > 0 && (
                    <Text variant="bodySmall" style={[styles.monthStat, { color: '#4caf50' }]}>
                      {month.completedCount} read
                    </Text>
                  )}
                  {month.totalSpent > 0 && (
                    <Text variant="bodySmall" style={[styles.monthStat, { color: '#ff9800' }]}>
                      ₹{month.totalSpent.toFixed(0)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  yearCard: {
    marginBottom: 16,
  },
  yearTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  yearSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    color: '#2196f3',
  },
  statLabel: {
    color: '#9e9e9e',
    marginTop: 2,
  },
  divider: {
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  monthName: {
    fontWeight: '500',
    width: 90,
  },
  monthStats: {
    flexDirection: 'row',
    gap: 12,
  },
  monthStat: {
    color: '#2196f3',
  },
});
