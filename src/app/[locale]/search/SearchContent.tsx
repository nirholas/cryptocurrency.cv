/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NewsCardCompact } from "@/components/NewsCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/categories";
import { useDebounce } from "@/hooks/useDebounce";
import type { NewsArticle } from "@/lib/crypto-news";

/* ------------------------------------------------
   Constants
   ------------------------------------------------ */

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const SEARCH_HISTORY_KEY = "fcn-search-history";
const MAX_HISTORY = 8;

const DATE_RANGES = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
] as const;

type SortOption = "newest" | "relevance";

const POPULAR_SEARCHES = [
  "bitcoin",
  "ethereum",
  "solana",
  "defi",
  "nft",
  "regulation",
  "SEC",
  "stablecoin",
];

/* ------------------------------------------------
   Helpers
   ------------------------------------------------ */

function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const history = getSearchHistory().filter(
      (h) => h.toLowerCase() !== query.trim().toLowerCase()
    );
    history.unshift(query.trim());
    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY))
    );
  } catch {
    /* ignore quota errors */
  }
}

function clearSearchHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------
   Skeleton loader for results
   ------------------------------------------------ */

function ResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 items-start">
          <Skeleton className="aspect-square w-20 shrink-0 rounded-md" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------
   Search icon SVG
   ------------------------------------------------ */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ------------------------------------------------
   Inner search page (needs Suspense boundary)
   ------------------------------------------------ */

function SearchPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* --- URL-synced state --- */
  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialSource = searchParams.get("source") ?? "";
  const initialSort = (searchParams.get("sort") as SortOption) || "newest";
  const initialRange = searchParams.get("range") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [source, setSource] = useState(initialSource);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [dateRange, setDateRange] = useState(initialRange);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  /* --- Data state --- */
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(!!initialQ);
  const [sources, setSources] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  /* --- Load sources list once --- */
  useEffect(() => {
    fetch("/api/sources")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setSources(data.map((s: { name?: string }) => s.name ?? String(s)));
        } else if (data?.sources) {
          setSources(
            data.sources.map((s: { name?: string }) => s.name ?? String(s))
          );
        }
      })
      .catch(() => {});
  }, []);

  /* --- Load search history on mount --- */
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  /* --- Sync URL params whenever filters change --- */
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (category) params.set("category", category);
    if (source) params.set("source", source);
    if (sort !== "newest") params.set("sort", sort);
    if (dateRange) params.set("range", dateRange);

    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [debouncedQuery, category, source, sort, dateRange, pathname, router]);

  /* --- Fetch results when filters change --- */
  useEffect(() => {
    if (!debouncedQuery.trim() && !category) {
      setResults([]);
      setTotalCount(0);
      setSearched(false);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    setPage(1);

    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
    if (category) params.set("category", category);
    if (source) params.set("source", source);
    if (dateRange) params.set("range", dateRange);
    params.set("limit", String(PAGE_SIZE));
    params.set("page", "1");

    fetch(`/api/news?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => {
        const articles: NewsArticle[] = data.articles ?? [];
        setResults(
          sort === "relevance"
            ? articles
            : articles.sort(
                (a: NewsArticle, b: NewsArticle) =>
                  new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
              )
        );
        setTotalCount(data.totalCount ?? articles.length);
        setHasMore(data.pagination?.hasMore ?? articles.length >= PAGE_SIZE);

        if (debouncedQuery.trim()) {
          saveSearchHistory(debouncedQuery.trim());
          setSearchHistory(getSearchHistory());
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setResults([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, category, source, sort, dateRange]);

  /* --- Load more handler --- */
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
    if (category) params.set("category", category);
    if (source) params.set("source", source);
    if (dateRange) params.set("range", dateRange);
    params.set("limit", String(PAGE_SIZE));
    params.set("page", String(nextPage));

    fetch(`/api/news?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => {
        const articles: NewsArticle[] = data.articles ?? [];
        setResults((prev) => [...prev, ...articles]);
        setPage(nextPage);
        setHasMore(data.pagination?.hasMore ?? articles.length >= PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, debouncedQuery, category, source, dateRange]);

  /* --- Quick-search handler for chips --- */
  const quickSearch = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* ---- Title ---- */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-text-primary">
          Search News
        </h1>

        {/* ---- Search Bar ---- */}
        <div className="relative max-w-2xl mb-4">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for crypto news…"
            className="w-full rounded-xl border border-border bg-(--color-surface) pl-12 pr-4 py-3.5 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* ---- Recent Searches ---- */}
        {searchHistory.length > 0 && !searched && (
          <div className="mb-6 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Recent searches
              </span>
              <button
                onClick={() => {
                  clearSearchHistory();
                  setSearchHistory([]);
                }}
                className="text-xs text-text-tertiary hover:text-accent transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term) => (
                <button
                  key={term}
                  onClick={() => quickSearch(term)}
                  className="rounded-full border border-border bg-(--color-surface) px-3 py-1 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Filter Bar ---- */}
        <div className="space-y-3 mb-8">
          {/* Category pills */}
          <div
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1"
          >
            <button
              onClick={() => setCategory("")}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                !category
                  ? "bg-accent text-white"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  setCategory(category === cat.slug ? "" : cat.slug)
                }
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  category === cat.slug
                    ? "bg-accent text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                )}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Second row: source, date range, sort */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Source dropdown */}
            {sources.length > 0 && (
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="rounded-lg border border-border bg-(--color-surface) px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Sources</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* Date range */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {DATE_RANGES.map((dr) => (
                <button
                  key={dr.value}
                  onClick={() => setDateRange(dr.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    dateRange === dr.value
                      ? "bg-accent text-white"
                      : "bg-(--color-surface) text-text-secondary hover:bg-surface-secondary"
                  )}
                >
                  {dr.label}
                </button>
              ))}
            </div>

            {/* Sort toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setSort("newest")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  sort === "newest"
                    ? "bg-accent text-white"
                    : "bg-(--color-surface) text-text-secondary hover:bg-surface-secondary"
                )}
              >
                Newest
              </button>
              <button
                onClick={() => setSort("relevance")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  sort === "relevance"
                    ? "bg-accent text-white"
                    : "bg-(--color-surface) text-text-secondary hover:bg-surface-secondary"
                )}
              >
                Relevance
              </button>
            </div>
          </div>
        </div>

        {/* ---- Results ---- */}

        {/* Result count */}
        {searched && !loading && results.length > 0 && (
          <p className="text-sm text-text-tertiary mb-4">
            {totalCount} result{totalCount !== 1 ? "s" : ""}
            {debouncedQuery.trim()
              ? ` for \u201c${debouncedQuery.trim()}\u201d`
              : ""}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && <ResultsSkeleton />}

        {/* Empty initial state */}
        {!loading && !searched && (
          <div className="py-16 text-center">
            <SearchIcon className="mx-auto h-12 w-12 text-text-tertiary opacity-40 mb-4" />
            <h2 className="text-lg font-semibold text-text-secondary mb-2">
              Discover crypto news
            </h2>
            <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
              Search across hundreds of sources for the latest cryptocurrency
              news, or browse by category above.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => quickSearch(term)}
                  className="rounded-full border border-border bg-(--color-surface) px-4 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors capitalize"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-text-secondary mb-2">
              No results found
            </p>
            <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
              {debouncedQuery.trim()
                ? `We couldn\u2019t find anything for \u201c${debouncedQuery.trim()}\u201d. Try a different search term or adjust your filters.`
                : "Try adjusting your filters or searching for something specific."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.slice(0, 4).map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => quickSearch(term)}
                  className="capitalize"
                >
                  Try &ldquo;{term}&rdquo;
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Result list */}
        {!loading && results.length > 0 && (
          <>
            <div className="space-y-4">
              {results.map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------
   Page wrapper with Suspense (useSearchParams requires it)
   ------------------------------------------------ */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="container-main py-10">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-text-primary">
              Search News
            </h1>
            <Skeleton className="h-12 w-full max-w-2xl mb-8 rounded-xl" />
            <ResultsSkeleton />
          </main>
          <Footer />
        </>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
