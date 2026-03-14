/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { ChartDataPoint, ChartResponse } from '../api/client';
import { fetchWithCache } from '../services/cache';

export type TimeRange = '1h' | '24h' | '7d' | '30d' | '1y';

interface ChartState {
  data: ChartDataPoint[];
  stats: ChartResponse['stats'] | null;
  loading: boolean;
  error: string | null;
  range: TimeRange;
  fromCache: boolean;
}

const RANGE_TTL: Record<TimeRange, number> = {
  '1h': 60_000, // 1 min
  '24h': 5 * 60_000, // 5 min
  '7d': 15 * 60_000, // 15 min
  '30d': 60 * 60_000, // 1 hour
  '1y': 6 * 60 * 60_000, // 6 hours
};

export function useChartData(coinId: string, initialRange: TimeRange = '24h') {
  const [state, setState] = useState<ChartState>({
    data: [],
    stats: null,
    loading: true,
    error: null,
    range: initialRange,
    fromCache: false,
  });

  const mountedRef = useRef(true);

  const fetchChart = useCallback(
    async (range: TimeRange) => {
      setState((prev) => ({ ...prev, loading: true, error: null, range }));
      try {
        const cacheKey = `chart:${coinId}:${range}`;
        const { data: response, fromCache } = await fetchWithCache(
          cacheKey,
          () => api.getChartData(coinId, range),
          RANGE_TTL[range],
        );
        if (mountedRef.current) {
          setState({
            data: response.priceData || [],
            stats: response.stats || null,
            loading: false,
            error: null,
            range,
            fromCache,
          });
        }
      } catch (err) {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load chart',
          }));
        }
      }
    },
    [coinId],
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchChart(state.range);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchChart]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRange = useCallback(
    (range: TimeRange) => {
      fetchChart(range);
    },
    [fetchChart],
  );

  const refresh = useCallback(() => fetchChart(state.range), [fetchChart, state.range]);

  return {
    data: state.data,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    range: state.range,
    fromCache: state.fromCache,
    setRange,
    refresh,
  };
}
