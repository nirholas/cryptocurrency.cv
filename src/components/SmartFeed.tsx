/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { NewsCardCompact } from '@/components/NewsCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/lib/crypto-news';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type FeedMode = 'latest' | 'personalized' | 'trending' | 'deep-dive';

interface FeedPreferences {
  categories: string[];
  sources: string[];
  minSentiment?: number;
  hideRead: boolean;
}

interface SmartFeedProps {
  initialArticles: NewsArticle[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const FEED_MODES: { id: FeedMode; labelKey: string; icon: string; descKey: string }[] = [
  { id: 'latest', labelKey: 'latest', icon: '⚡', descKey: 'latestDesc' },
  { id: 'personalized', labelKey: 'forYou', icon: '✨', descKey: 'forYouDesc' },
  { id: 'trending', labelKey: 'trending', icon: '🔥', descKey: 'trendingDesc' },
  { id: 'deep-dive', labelKey: 'deepDive', icon: '🔬', descKey: 'deepDiveDesc' },
];

const AUTO_REFRESH_INTERVALS = [
  { labelKey: 'autoOff', label: 'Off', value: 0 },
  { labelKey: 'auto30s', label: '30s', value: 30000 },
  { labelKey: 'auto1m', label: '1m', value: 60000 },
  { labelKey: 'auto5m', label: '5m', value: 300000 },
] as const;

const READ_ARTICLES_KEY = 'fcn-read-articles';
const FEED_PREFS_KEY = 'fcn-feed-prefs';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getReadArticles(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_ARTICLES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markAsRead(url: string) {
  const read = getReadArticles();
  read.add(url);
  // Keep only last 500 articles
  const arr = [...read].slice(-500);
  localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(arr));
}

function loadFeedPrefs(): FeedPreferences {
  if (typeof window === 'undefined') return { categories: [], sources: [], hideRead: false };
  try {
    const raw = localStorage.getItem(FEED_PREFS_KEY);
    return raw ? JSON.parse(raw) : { categories: [], sources: [], hideRead: false };
  } catch {
    return { categories: [], sources: [], hideRead: false };
  }
}

function saveFeedPrefs(prefs: FeedPreferences) {
  localStorage.setItem(FEED_PREFS_KEY, JSON.stringify(prefs));
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getTimeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  New articles banner                                               */
/* ------------------------------------------------------------------ */

function NewArticlesBanner({ count, onClick }: { count: number; onClick: () => void }) {
  const t = useTranslations('smartFeed');
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'mb-4 w-full rounded-lg px-4 py-3',
        'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30',
        'text-sm font-medium text-blue-700 dark:text-blue-300',
        'flex items-center justify-center gap-2',
        'transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50',
        'animate-in slide-in-from-top duration-300',
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
      </span>
      {t('newArticles', { count })}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading progress tracker                                          */
/* ------------------------------------------------------------------ */

function ArticleReadIndicator({ article, isRead }: { article: NewsArticle; isRead: boolean }) {
  const t = useTranslations('smartFeed');
  return (
    <div className="group relative">
      <NewsCardCompact article={article} />
      {isRead && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-green-900/40 dark:text-green-300">
          ✓ {t('read')}
        </div>
      )}
      <div className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-text-tertiary text-[10px]">
          {t('minRead', {
            minutes: estimateReadingTime(article.title + ' ' + (article.description ?? '')),
          })}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Smart Feed Component                                              */
/* ------------------------------------------------------------------ */

export function SmartFeed({ initialArticles, className }: SmartFeedProps) {
  const t = useTranslations('smartFeed');
  const [mode, setMode] = useState<FeedMode>('latest');
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [newArticles, setNewArticles] = useState<NewsArticle[]>([]);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(60000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<FeedPreferences>({
    categories: [],
    sources: [],
    hideRead: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load preferences and read history
  useEffect(() => {
    setReadArticles(getReadArticles());
    setPrefs(loadFeedPrefs());
  }, []);

  // Track article clicks
  const handleArticleClick = useCallback((url: string) => {
    markAsRead(url);
    setReadArticles((prev) => new Set([...prev, url]));
  }, []);

  // Auto-refresh logic
  const fetchNewArticles = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/news?limit=10&fresh=true&sources=homepage', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const fetched: NewsArticle[] = data.articles ?? [];
      const existingUrls = new Set(articles.map((a) => a.link));
      const fresh = fetched.filter((a) => !existingUrls.has(a.link));
      if (fresh.length > 0) {
        setNewArticles((prev) => [...fresh, ...prev]);
      }
      setLastUpdated(new Date());
    } catch {
      // Silent fail for auto-refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [articles, isRefreshing]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh > 0) {
      intervalRef.current = setInterval(fetchNewArticles, autoRefresh);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchNewArticles]);

  // Merge new articles into feed
  const mergeNewArticles = useCallback(() => {
    setArticles((prev) => [...newArticles, ...prev]);
    setNewArticles([]);
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [newArticles]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/news?limit=20&page=${nextPage}&sources=homepage`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const moreArticles: NewsArticle[] = data.articles ?? [];
      if (moreArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...moreArticles]);
        setPage(nextPage);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  // Apply feed mode filtering + sorting
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Apply hide-read filter
    if (prefs.hideRead) {
      result = result.filter((a) => !readArticles.has(a.link));
    }

    // Apply category filter
    if (prefs.categories.length > 0) {
      result = result.filter((a) => {
        const cats = (a as NewsArticle & { categories?: string[] }).categories ?? [];
        return cats.some((c) => prefs.categories.includes(c));
      });
    }

    // Apply mode-specific sorting
    switch (mode) {
      case 'trending':
        // Sort by engagement signals (approximate from title keywords)
        result.sort((a, b) => {
          const scoreA =
            (a.title.match(/breaking|surge|crash|record|billion|million/i) ? 10 : 0) +
            (a.title.length < 80 ? 5 : 0);
          const scoreB =
            (b.title.match(/breaking|surge|crash|record|billion|million/i) ? 10 : 0) +
            (b.title.length < 80 ? 5 : 0);
          return scoreB - scoreA;
        });
        break;
      case 'deep-dive':
        // Longer articles first (proxy via description length)
        result.sort((a, b) => {
          const lenA = (a.description ?? '').length;
          const lenB = (b.description ?? '').length;
          return lenB - lenA;
        });
        break;
      case 'personalized': {
        // Boost articles from sources the user has previously read
        result.sort((a, b) => {
          const aFromRead = readArticles.has(a.source ?? '') ? 5 : 0;
          const bFromRead = readArticles.has(b.source ?? '') ? 5 : 0;
          return bFromRead - aFromRead;
        });
        break;
      }
      default:
        // "latest" — already sorted by date
        break;
    }

    return result;
  }, [articles, mode, prefs, readArticles]);

  // Stats
  const readCount = articles.filter((a) => readArticles.has(a.link)).length;
  const readPercent = articles.length > 0 ? Math.round((readCount / articles.length) * 100) : 0;

  return (
    <div className={cn('space-y-4', className)} ref={feedRef}>
      {/* ── Feed Mode Tabs ── */}
      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
        {FEED_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={t(m.descKey)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
              mode === m.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
            )}
          >
            <span>{m.icon}</span>
            {t(m.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Controls Bar ── */}
      <div className="text-text-tertiary flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {/* Auto-refresh selector */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                autoRefresh > 0 ? 'animate-pulse bg-green-500' : 'bg-gray-400 dark:bg-gray-600',
              )}
            />
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
              className="cursor-pointer border-none bg-transparent text-xs focus:outline-none"
            >
              {AUTO_REFRESH_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Auto: {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Last updated */}
          <span>Updated {getTimeSince(lastUpdated.toISOString())}</span>

          {/* Read progress */}
          <span className="hidden sm:inline">
            {readCount}/{articles.length} read ({readPercent}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual refresh */}
          <button
            onClick={fetchNewArticles}
            disabled={isRefreshing}
            className={cn(
              'hover:bg-surface-secondary rounded p-1 transition-colors',
              isRefreshing && 'animate-spin',
            )}
            title={t('refreshNow')}
          >
            🔄
          </button>

          {/* Feed preferences toggle */}
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className="hover:bg-surface-secondary rounded p-1 transition-colors"
            title={t('feedPrefs')}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ── Preferences Panel ── */}
      {showPrefs && (
        <div className="border-border bg-surface-secondary animate-in slide-in-from-top space-y-3 rounded-lg border p-4 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('feedPreferences')}</h4>
            <button
              onClick={() => {
                setPrefs({ categories: [], sources: [], hideRead: false });
                saveFeedPrefs({ categories: [], sources: [], hideRead: false });
              }}
              className="text-accent text-xs hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Hide read toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.hideRead}
              onChange={(e) => {
                const next = { ...prefs, hideRead: e.target.checked };
                setPrefs(next);
                saveFeedPrefs(next);
              }}
              className="border-border rounded"
            />
            {t('hideRead')}
          </label>

          {/* Category quick-filters */}
          <div>
            <p className="text-text-tertiary mb-1.5 text-xs">{t('focusCategories')}</p>
            <div className="flex flex-wrap gap-1.5">
              {['Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulation', 'Trading', 'Altcoins'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const slug = cat.toLowerCase();
                      const next = prefs.categories.includes(slug)
                        ? { ...prefs, categories: prefs.categories.filter((c) => c !== slug) }
                        : { ...prefs, categories: [...prefs.categories, slug] };
                      setPrefs(next);
                      saveFeedPrefs(next);
                    }}
                    className={cn(
                      'rounded px-2 py-0.5 text-xs transition-colors',
                      prefs.categories.includes(cat.toLowerCase())
                        ? 'bg-accent text-white'
                        : 'bg-surface-tertiary text-text-secondary hover:bg-border',
                    )}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Articles Banner ── */}
      <NewArticlesBanner count={newArticles.length} onClick={mergeNewArticles} />

      {/* ── Articles List ── */}
      <div className="space-y-1">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <div
              key={article.link}
              onClick={() => handleArticleClick(article.link)}
              className={cn(
                'border-border border-b pb-5 transition-opacity last:border-b-0',
                readArticles.has(article.link) && 'opacity-60',
              )}
            >
              <ArticleReadIndicator article={article} isRead={readArticles.has(article.link)} />
            </div>
          ))
        ) : (
          <div className="text-text-tertiary py-12 text-center">
            <p className="mb-2 text-lg">{t('noMatch')}</p>
            <p className="text-sm">{t('noMatchHint')}</p>
          </div>
        )}
      </div>

      {/* ── Load More ── */}
      {hasMore && filteredArticles.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline" className="min-w-50">
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </span>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feed Stats Widget (for sidebar)                                   */
/* ------------------------------------------------------------------ */

/** Emoji for each market mood `/api/sentiment` reports. */
const MOOD_ICONS: Record<string, string> = {
  very_bullish: '\u{1F680}',
  bullish: '\u{1F4C8}',
  neutral: '\u{1F610}',
  bearish: '\u{1F4C9}',
  very_bearish: '\u{1F327}',
};

export function FeedStatsWidget({ className }: { className?: string }) {
  const t = useTranslations('smartFeed');
  const [readToday, setReadToday] = useState(0);
  const [articlesToday, setArticlesToday] = useState<number | null>(null);
  const [topSource, setTopSource] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);

  useEffect(() => {
    // How many articles this reader has opened is genuinely local.
    setReadToday(getReadArticles().size);

    let cancelled = false;

    (async () => {
      // Everything else is measured server-side. It used to be invented here:
      // `articlesToday` was `Math.random() * 50 + 30` and the top source was
      // the string "CoinDesk", refreshed on every page load.
      const [statsResult, sentimentResult] = await Promise.allSettled([
        fetch('/api/stats').then((res) => (res.ok ? res.json() : null)),
        fetch('/api/sentiment?limit=30').then((res) => (res.ok ? res.json() : null)),
      ]);

      if (cancelled) return;

      if (statsResult.status === 'fulfilled' && statsResult.value) {
        const stats = statsResult.value as {
          summary?: { totalArticles?: number };
          bySource?: { source?: string }[];
        };
        if (typeof stats.summary?.totalArticles === 'number') {
          setArticlesToday(stats.summary.totalArticles);
        }
        const leader = stats.bySource?.[0]?.source;
        if (leader) setTopSource(leader);
      }

      if (sentimentResult.status === 'fulfilled' && sentimentResult.value) {
        const overall = (sentimentResult.value as { market?: { overall?: string } }).market?.overall;
        if (overall) setMood(overall);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cn('border-border bg-surface-secondary rounded-lg border p-4', className)}>
      <h4 className="mb-3 text-sm font-semibold">📊 {t('yourFeedStats')}</h4>
      <dl className="space-y-2 text-sm">
        {articlesToday !== null && (
          <div className="flex justify-between">
            <dt className="text-text-secondary">{t('articlesToday')}</dt>
            <dd className="font-medium">{articlesToday}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-text-secondary">{t('youveRead')}</dt>
          <dd className="font-medium">{readToday}</dd>
        </div>
        {topSource && (
          <div className="flex justify-between">
            <dt className="text-text-secondary">{t('topSource')}</dt>
            <dd className="font-medium">{topSource}</dd>
          </div>
        )}
        {mood && (
          <div className="flex justify-between">
            <dt className="text-text-secondary">{t('mood')}</dt>
            <dd className="font-medium">
              {MOOD_ICONS[mood] ?? ''} {mood.replace('_', ' ')}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default SmartFeed;
