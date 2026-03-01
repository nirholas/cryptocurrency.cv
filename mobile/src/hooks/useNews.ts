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
import api, { Article, NewsResponse } from '../api/client';

interface UseNewsOptions {
  limit?: number;
  source?: string;
  ticker?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNewsResult {
  articles: Article[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useNews(options: UseNewsOptions = {}): UseNewsResult {
  const { 
    limit = 20, 
    source, 
    ticker, 
    autoRefresh = false, 
    refreshInterval = 60000 
  } = options;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNews = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const response = await api.getNews(limit, source, ticker);
      
      if (reset) {
        setArticles(response.articles);
        setPage(1);
      } else {
        setArticles(prev => [...prev, ...response.articles]);
      }
      
      setHasMore(response.articles.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [limit, source, ticker, page]);

  const refresh = useCallback(async () => {
    await fetchNews(true);
  }, [fetchNews]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
      await fetchNews(false);
    }
  }, [loading, hasMore, fetchNews]);

  useEffect(() => {
    fetchNews(true);
  }, [source, ticker]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refresh]);

  return { articles, loading, error, refresh, loadMore, hasMore };
}

export function useBreakingNews(limit: number = 10) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getBreakingNews(limit);
      setArticles(response.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetch]);

  return { articles, loading, error, refresh: fetch };
}

export function useTrending(limit: number = 10) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getTrending(limit);
      setArticles(response.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { articles, loading, error, refresh: fetch };
}

export function useSearch(query: string, limit: number = 20) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) {
      setArticles([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.search(query, limit);
      setArticles(response.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

  useEffect(() => {
    const timeout = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [search]);

  return { articles, loading, error };
}
