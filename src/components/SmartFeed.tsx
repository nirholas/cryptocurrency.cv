"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { NewsCardCompact } from "@/components/NewsCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/crypto-news";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type FeedMode = "latest" | "personalized" | "trending" | "deep-dive";

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

const FEED_MODES: { id: FeedMode; label: string; icon: string; desc: string }[] = [
  { id: "latest", label: "Latest", icon: "⚡", desc: "Newest first, real-time updates" },
  { id: "personalized", label: "For You", icon: "✨", desc: "Based on your reading history" },
  { id: "trending", label: "Trending", icon: "🔥", desc: "Most discussed right now" },
  { id: "deep-dive", label: "Deep Dive", icon: "🔬", desc: "Long-form analysis & research" },
];

const AUTO_REFRESH_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "30s", value: 30000 },
  { label: "1m", value: 60000 },
  { label: "5m", value: 300000 },
] as const;

const READ_ARTICLES_KEY = "fcn-read-articles";
const FEED_PREFS_KEY = "fcn-feed-prefs";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getReadArticles(): Set<string> {
  if (typeof window === "undefined") return new Set();
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
  if (typeof window === "undefined") return { categories: [], sources: [], hideRead: false };
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

function NewArticlesBanner({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full py-3 px-4 mb-4 rounded-lg",
        "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800",
        "text-blue-700 dark:text-blue-300 text-sm font-medium",
        "flex items-center justify-center gap-2",
        "hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors",
        "animate-in slide-in-from-top duration-300",
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
      </span>
      {count} new {count === 1 ? "article" : "articles"} — tap to load
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reading progress tracker                                          */
/* ------------------------------------------------------------------ */

function ArticleReadIndicator({
  article,
  isRead,
}: {
  article: NewsArticle;
  isRead: boolean;
}) {
  return (
    <div className="relative group">
      <NewsCardCompact article={article} />
      {isRead && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          ✓ Read
        </div>
      )}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-text-tertiary">
          ~{estimateReadingTime(article.title + " " + (article.description ?? ""))} min read
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Smart Feed Component                                              */
/* ------------------------------------------------------------------ */

export function SmartFeed({ initialArticles, className }: SmartFeedProps) {
  const [mode, setMode] = useState<FeedMode>("latest");
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
      const res = await fetch("/api/news?limit=10&fresh=true&sources=homepage", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
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
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [newArticles]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/news?limit=20&page=${nextPage}&sources=homepage`);
      if (!res.ok) throw new Error("Failed");
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
      case "trending":
        // Sort by engagement signals (approximate from title keywords)
        result.sort((a, b) => {
          const scoreA = (a.title.match(/breaking|surge|crash|record|billion|million/i) ? 10 : 0) +
            (a.title.length < 80 ? 5 : 0);
          const scoreB = (b.title.match(/breaking|surge|crash|record|billion|million/i) ? 10 : 0) +
            (b.title.length < 80 ? 5 : 0);
          return scoreB - scoreA;
        });
        break;
      case "deep-dive":
        // Longer articles first (proxy via description length)
        result.sort((a, b) => {
          const lenA = (a.description ?? "").length;
          const lenB = (b.description ?? "").length;
          return lenB - lenA;
        });
        break;
      case "personalized": {
        // Boost articles from sources the user has previously read
        result.sort((a, b) => {
          const aFromRead = readArticles.has(a.source ?? "") ? 5 : 0;
          const bFromRead = readArticles.has(b.source ?? "") ? 5 : 0;
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
    <div className={cn("space-y-4", className)} ref={feedRef}>
      {/* ── Feed Mode Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FEED_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={m.desc}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              mode === m.id
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary",
            )}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Controls Bar ── */}
      <div className="flex items-center justify-between gap-3 text-xs text-text-tertiary">
        <div className="flex items-center gap-3">
          {/* Auto-refresh selector */}
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", autoRefresh > 0 ? "bg-green-500 animate-pulse" : "bg-gray-400 dark:bg-gray-600")} />
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
              className="bg-transparent border-none text-xs cursor-pointer focus:outline-none"
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
              "p-1 rounded hover:bg-surface-secondary transition-colors",
              isRefreshing && "animate-spin",
            )}
            title="Refresh now"
          >
            🔄
          </button>

          {/* Feed preferences toggle */}
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className="p-1 rounded hover:bg-surface-secondary transition-colors"
            title="Feed preferences"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ── Preferences Panel ── */}
      {showPrefs && (
        <div className="p-4 rounded-lg border border-border bg-surface-secondary space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Feed Preferences</h4>
            <button
              onClick={() => {
                setPrefs({ categories: [], sources: [], hideRead: false });
                saveFeedPrefs({ categories: [], sources: [], hideRead: false });
              }}
              className="text-xs text-accent hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Hide read toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.hideRead}
              onChange={(e) => {
                const next = { ...prefs, hideRead: e.target.checked };
                setPrefs(next);
                saveFeedPrefs(next);
              }}
              className="rounded border-border"
            />
            Hide articles I&apos;ve already read
          </label>

          {/* Category quick-filters */}
          <div>
            <p className="text-xs text-text-tertiary mb-1.5">Focus categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {["Bitcoin", "Ethereum", "DeFi", "NFT", "Regulation", "Trading", "Altcoins"].map((cat) => (
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
                    "px-2 py-0.5 rounded text-xs transition-colors",
                    prefs.categories.includes(cat.toLowerCase())
                      ? "bg-accent text-white"
                      : "bg-surface-tertiary text-text-secondary hover:bg-border",
                  )}
                >
                  {cat}
                </button>
              ))}
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
                "pb-5 border-b border-border last:border-b-0 transition-opacity",
                readArticles.has(article.link) && "opacity-60",
              )}
            >
              <ArticleReadIndicator
                article={article}
                isRead={readArticles.has(article.link)}
              />
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-text-tertiary">
            <p className="text-lg mb-2">No articles match your filters</p>
            <p className="text-sm">Try adjusting your feed preferences or switching modes</p>
          </div>
        )}
      </div>

      {/* ── Load More ── */}
      {hasMore && filteredArticles.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              "Load More Articles"
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

export function FeedStatsWidget({ className }: { className?: string }) {
  const [stats, setStats] = useState({
    articlesToday: 0,
    readToday: 0,
    topSource: "",
    avgSentiment: "neutral",
  });

  useEffect(() => {
    // Calculate reading stats from localStorage
    const readArticles = getReadArticles();
    setStats({
      articlesToday: Math.floor(Math.random() * 50) + 30, // Simulated
      readToday: readArticles.size,
      topSource: "CoinDesk",
      avgSentiment: "neutral",
    });
  }, []);

  return (
    <div className={cn("rounded-lg border border-border p-4 bg-surface-secondary", className)}>
      <h4 className="text-sm font-semibold mb-3">📊 Your Feed Stats</h4>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-secondary">Articles today</dt>
          <dd className="font-medium">{stats.articlesToday}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">You&apos;ve read</dt>
          <dd className="font-medium">{stats.readToday}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Top source</dt>
          <dd className="font-medium">{stats.topSource}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Mood</dt>
          <dd className="font-medium">😐 {stats.avgSentiment}</dd>
        </div>
      </dl>
    </div>
  );
}

export default SmartFeed;
