/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useState, useEffect, useCallback } from 'react';
import api, { MarketCoin, FearGreed, Sentiment } from '../api/client';

export function useMarketCoins(limit: number = 20) {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getMarketCoins(limit);
      setCoins(response.coins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [fetch]);

  return { coins, loading, error, refresh: fetch };
}

export function useFearGreed() {
  const [data, setData] = useState<FearGreed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFearGreed();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

export function useSentiment(asset?: string) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getSentiment(asset);
      setSentiment(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { sentiment, loading, error, refresh: fetch };
}

export function useCoinPrice(symbol: string) {
  const [coin, setCoin] = useState<MarketCoin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCoinPrice(symbol);
      setCoin(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [fetch]);

  return { coin, loading, error, refresh: fetch };
}
