import { useState, useEffect, useCallback } from 'react';
import { StatisticsSummary } from '../types';
import { getStatisticsSummary } from '../db/bookQueries';

export function useStatistics() {
  const [stats, setStats] = useState<StatisticsSummary>({
    ownedCount: 0,
    completedCount: 0,
    soldCount: 0,
    totalSpent: 0,
    totalEarnings: 0,
    netSpent: 0,
    monthly: [],
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setStats(await getStatisticsSummary(startDate, endDate));
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, refresh: loadStats };
}
