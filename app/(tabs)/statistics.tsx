import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Card, Divider, SegmentedButtons, IconButton, Button } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useStatistics } from '../../src/hooks/useStatistics';
import { DatePickerInput } from '../../src/components/DatePickerInput';
import { StatisticsSummary } from '../../src/types';

type StatisticsMode = 'year' | 'custom';
type CustomRange = '3months' | '6months' | '365days' | 'custom';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getRange(mode: StatisticsMode, year: number, start: string | null, end: string | null): [string, string] {
  if (mode === 'year') return [`${year}-01-01`, `${year}-12-31`];
  return [start || formatDate(new Date()), end || formatDate(new Date())];
}

export default function StatisticsScreen() {
  const today = new Date();
  const { stats, loading, refresh } = useStatistics();
  const router = useRouter();
  const [mode, setMode] = useState<StatisticsMode>('year');
  const [year, setYear] = useState(today.getFullYear());
  const [customRange, setCustomRange] = useState<CustomRange>('3months');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    const [startDate, endDate] = getRange(mode, year, customStart, customEnd);
    refresh(startDate, endDate);
  }, [customEnd, customStart, mode, refresh, year]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(useCallback(() => {
    loadStats();
  }, [loadStats]));

  const changeYear = (amount: number) => setYear((current) => current + amount);
  const selectCustomRange = (range: CustomRange) => {
    setCustomRange(range);
    if (range === 'custom') return;
    const end = new Date();
    const start = new Date();
    if (range === '3months') start.setMonth(start.getMonth() - 3);
    if (range === '6months') start.setMonth(start.getMonth() - 6);
    if (range === '365days') start.setDate(start.getDate() - 365);
    setCustomStart(formatDate(start));
    setCustomEnd(formatDate(end));
  };

  const rangeLabel = mode === 'year'
    ? String(year)
    : customRange === 'custom' ? 'Custom dates' : customRange === '365days' ? 'Last 365 days' : `Last ${customRange === '3months' ? '3' : '6'} months`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as StatisticsMode)}
        buttons={[
          { value: 'year', label: 'Overview' },
          { value: 'custom', label: 'Custom Period' },
        ]}
        style={styles.modeSelector}
      />

      {mode === 'year' && (
        <View style={styles.periodSelector}>
          <IconButton icon="chevron-left" onPress={() => changeYear(-1)} />
          <Text variant="titleLarge" style={styles.periodTitle}>{year}</Text>
          <IconButton icon="chevron-right" onPress={() => changeYear(1)} />
        </View>
      )}

      {mode === 'custom' && (
        <>
          <View style={styles.rangeButtons}>
            {[
              ['3months', 'Last 3 Months'],
              ['6months', 'Last 6 Months'],
              ['365days', 'Last 365 Days'],
              ['custom', 'Choose Dates'],
            ].map(([value, label]) => (
              <Button key={value} mode={customRange === value ? 'contained' : 'outlined'} onPress={() => selectCustomRange(value as CustomRange)}>
                {label}
              </Button>
            ))}
          </View>
          {customRange === 'custom' && (
            <View style={styles.dateFields}>
              <DatePickerInput label="Start Date" value={customStart} onChange={setCustomStart} />
              <DatePickerInput label="End Date" value={customEnd} onChange={setCustomEnd} />
            </View>
          )}
        </>
      )}

      <Text variant="titleMedium" style={styles.rangeLabel}>{rangeLabel}</Text>
      <SummaryCard stats={stats} year={year} expandable={mode === 'year'} onOpenBooks={(metric, selectedMonth) => {
        const monthValue = selectedMonth === undefined ? undefined : String(selectedMonth).padStart(2, '0');
        router.push(`/statistics/books?metric=${metric}&startDate=${year}-${monthValue || '01'}-01&endDate=${year}-${monthValue || '12'}-${monthValue ? new Date(year, selectedMonth!, 0).getDate() : '31'}`);
      }} />
      {mode === 'year' && <MonthlyChart monthly={stats.monthly} />}
      {loading && <Text style={styles.message}>Updating statistics...</Text>}
    </ScrollView>
  );
}

function SummaryCard({ stats, year, expandable, onOpenBooks }: { stats: StatisticsSummary; year: number; expandable: boolean; onOpenBooks: (metric: 'purchased' | 'completed' | 'sold', month?: number) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (metric: string) => setExpanded((current) => current === metric ? null : metric);
  const monthlyRows = (metric: 'purchased' | 'completed' | 'sold') => stats.monthly.map((month) => ({
    month: month.month,
    count: metric === 'purchased' ? month.purchasedCount : metric === 'completed' ? month.completedCount : month.soldCount,
  }));

  const countMetric = (label: string, value: number, color: string, metric: 'purchased' | 'completed' | 'sold') => (
    <View>
      <Pressable style={styles.metricRow} onPress={() => expandable && toggle(metric)}>
        <Text variant="bodyLarge">{expandable ? `${expanded === metric ? 'v' : '>'} ${label}` : label}</Text>
        <Text variant="titleLarge" onPress={() => onOpenBooks(metric)} style={{ color, fontWeight: '700' }}>{value}</Text>
      </Pressable>
      {expandable && expanded === metric && monthlyRows(metric).map((item) => (
        <Pressable key={item.month} style={styles.monthRow} onPress={() => onOpenBooks(metric, item.month)}>
          <Text style={styles.monthLabel}>{monthNames[item.month - 1]}</Text>
          <Text style={{ color, fontWeight: '700' }}>{item.count}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Card style={styles.summaryCard}>
      <Card.Content>
        {countMetric('Books Purchased', stats.ownedCount, '#2196f3', 'purchased')}
        {countMetric('Books Completed', stats.completedCount, '#4caf50', 'completed')}
        {countMetric('Books Sold', stats.soldCount, '#f44336', 'sold')}
        <Divider style={styles.divider} />
        <Metric label="Total Spent" value={`₹${stats.totalSpent.toFixed(0)}`} color="#ff9800" />
        <Metric label="Total Earnings" value={`₹${stats.totalEarnings.toFixed(0)}`} color="#00897b" />
        <Metric label="Net Spent" value={`₹${stats.netSpent.toFixed(0)}`} color="#6750a4" />
      </Card.Content>
    </Card>
  );
}

function MonthlyChart({ monthly }: { monthly: StatisticsSummary['monthly'] }) {
  const rows = Array.from({ length: 12 }, (_, index) => monthly.find((item) => item.month === index + 1) || {
    month: index + 1, purchasedCount: 0, completedCount: 0, soldCount: 0, netSpent: 0,
  });
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.purchasedCount, row.completedCount, row.soldCount, row.netSpent]));

  return (
    <Card style={styles.chartCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.chartTitle}>Monthly Activity</Text>
        <View style={styles.legend}>
          <Text style={{ color: '#2196f3' }}>Purchased</Text>
          <Text style={{ color: '#f44336' }}>Sold</Text>
          <Text style={{ color: '#4caf50' }}>Completed</Text>
          <Text style={{ color: '#6750a4' }}>Net Spent</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {rows.map((row) => (
              <View key={row.month} style={styles.chartMonth}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: Math.max(2, row.purchasedCount / maxValue * 110), backgroundColor: '#2196f3' }]} />
                  <View style={[styles.bar, { height: Math.max(2, row.soldCount / maxValue * 110), backgroundColor: '#f44336' }]} />
                  <View style={[styles.bar, { height: Math.max(2, row.completedCount / maxValue * 110), backgroundColor: '#4caf50' }]} />
                  <View style={[styles.bar, { height: Math.max(2, row.netSpent / maxValue * 110), backgroundColor: '#6750a4' }]} />
                </View>
                <Text style={styles.chartMonthLabel}>{monthNames[row.month - 1].slice(0, 3)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metricRow}>
      <Text variant="bodyLarge">{label}</Text>
      <Text variant="titleLarge" style={{ color, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  modeSelector: { marginBottom: 16 },
  periodSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  periodTitle: { minWidth: 170, textAlign: 'center', fontWeight: '700' },
  rangeButtons: { gap: 8, marginBottom: 8 },
  dateFields: { marginTop: 4 },
  rangeLabel: { color: '#616161', marginBottom: 12, textAlign: 'center' },
  summaryCard: { marginBottom: 16 },
  chartCard: { marginBottom: 16 },
  chartTitle: { fontWeight: '700', marginBottom: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 150, paddingTop: 12 },
  chartMonth: { width: 54, alignItems: 'center', justifyContent: 'flex-end', height: 140 },
  bars: { height: 115, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 9, borderRadius: 2 },
  chartMonthLabel: { marginTop: 8, color: '#616161', fontSize: 11 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingLeft: 24, backgroundColor: '#fafafa' },
  monthLabel: { color: '#616161' },
  divider: { marginVertical: 8 },
  message: { textAlign: 'center', color: '#757575', marginTop: 32 },
});
