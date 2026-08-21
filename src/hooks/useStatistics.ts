import { useState, useEffect, useCallback } from 'react';
import { YearlyStats, MonthlyStats } from '../types';
import { getPurchasedStats, getCompletedStats } from '../db/bookQueries';

export function useStatistics() {
  const [stats, setStats] = useState<YearlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const purchased = await getPurchasedStats();
      const completed = await getCompletedStats();

      const yearMap = new Map<number, YearlyStats>();

      for (const p of purchased) {
        if (!yearMap.has(p.year)) {
          yearMap.set(p.year, {
            year: p.year,
            purchasedCount: 0,
            completedCount: 0,
            totalSpent: 0,
            months: [],
          });
        }
        const yearData = yearMap.get(p.year)!;
        yearData.purchasedCount += p.count;
        yearData.totalSpent += p.totalSpent;
        
        const existingMonth = yearData.months.find(m => m.month === p.month);
        if (existingMonth) {
          existingMonth.purchasedCount = p.count;
          existingMonth.totalSpent = p.totalSpent;
        } else {
          yearData.months.push({
            year: p.year,
            month: p.month,
            purchasedCount: p.count,
            completedCount: 0,
            totalSpent: p.totalSpent,
          });
        }
      }

      for (const c of completed) {
        if (!yearMap.has(c.year)) {
          yearMap.set(c.year, {
            year: c.year,
            purchasedCount: 0,
            completedCount: 0,
            totalSpent: 0,
            months: [],
          });
        }
        const yearData = yearMap.get(c.year)!;
        yearData.completedCount += c.count;

        const existingMonth = yearData.months.find(m => m.month === c.month);
        if (existingMonth) {
          existingMonth.completedCount = c.count;
        } else {
          yearData.months.push({
            year: c.year,
            month: c.month,
            purchasedCount: 0,
            completedCount: c.count,
            totalSpent: 0,
          });
        }
      }

      // Sort months within each year
      for (const yearData of yearMap.values()) {
        yearData.months.sort((a, b) => b.month - a.month);
      }

      const result = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
      setStats(result);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, refresh: loadStats };
}
