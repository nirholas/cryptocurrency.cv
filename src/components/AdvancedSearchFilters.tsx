"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                 */
/* ------------------------------------------------------------------ */

interface SearchResult {
  title: string;
  link: string;
  description?: string;
  source: string;
  category: string;
  pubDate: string;
  timeAgo: string;
  imageUrl?: string;
  sentiment?: string;
}

type SortOption = "relevance" | "newest" | "oldest";
type TimeRange = "all" | "1h" | "24h" | "7d" | "30d";

const CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "bitcoin", label: "Bitcoin" },
  { slug: "ethereum", label: "Ethereum" },
  { slug: "defi", label: "DeFi" },
  { slug: "nft", label: "NFTs" },
  { slug: "regulation", label: "Regulation" },
  { slug: "altcoins", label: "Altcoins" },
  { slug: "trading", label: "Markets" },
  { slug: "technology", label: "Technology" },
  { slug: "geopolitical", label: "Geopolitical" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "1h", label: "Past Hour" },
  { value: "24h", label: "Past 24h" },
  { value: "7d", label: "Past Week" },
  { value: "30d", label: "Past Month" },
];

/* ------------------------------------------------------------------ */
/*  AdvancedSearchFilters component                                    */
/* ------------------------------------------------------------------ */

export function AdvancedSearchFilters({
  onSearch,
  initialQuery,
  className,
}: {
  onSearch?: (results: SearchResult[], total: number) => void;
  initialQuery?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [source, setSource] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fcn:recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 8));
    } catch { /* */ }
  }, []);

  const saveRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches((prev) => {
      const updated = [q, ...prev.filter((s) => s !== q)].slice(0, 8);
      try { localStorage.setItem("fcn:recent-searches", JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  // Build URL and fetch
  const search = useCallback(
    async (searchQuery?: string, searchPage?: number) => {
      const q = searchQuery ?? query;
      if (!q.trim()) {
        setResults([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q, limit: "20", page: String(searchPage ?? page) });
        if (category !== "all") params.set("category", category);
        if (source) params.set("source", source);
        if (sortBy !== "relevance") params.set("sort", sortBy);
        if (timeRange !== "all") params.set("timeRange", timeRange);

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();

        const articles: SearchResult[] = data?.articles ?? data?.results ?? [];
        const total = data?.totalCount ?? data?.total ?? articles.length;

        setResults((prev) => (searchPage && searchPage > 1 ? [...prev, ...articles] : articles));
        setTotalResults(total);
        onSearch?.(articles, total);
        saveRecentSearch(q);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    },
    [query, category, sortBy, timeRange, source, page, onSearch, saveRecentSearch],
  );

  // Auto-suggest (debounced)
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setPage(1);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.length >= 2) {
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=5`);
            const data = await res.json();
            const titles = (data?.articles ?? data?.results ?? [])
              .map((a: SearchResult) => a.title)
              .slice(0, 5);
            setSuggestions(titles);
          } catch {
            setSuggestions([]);
          }
        }, 300);
      } else {
        setSuggestions([]);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    search();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try { localStorage.removeItem("fcn:recent-searches"); } catch { /* */ }
  };

  return (
    <div className={cn("", className)}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)]"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search crypto news, coins, topics..."
            className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]
                       placeholder:text-[var(--color-text-tertiary)]"
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors",
                showFilters
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)]",
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 inline mr-1">
                <path d="M14 2H2l5 5.59V12l2 1V7.59L14 2Z" />
              </svg>
              Filters
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-surface-secondary)] transition-colors"
                onClick={() => {
                  setQuery(s);
                  setSuggestions([]);
                  search(s);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 inline mr-2 text-[var(--color-text-tertiary)]">
                  <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
                </svg>
                <span className="line-clamp-1">{s}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-4">
          {/* Category filter */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setCategory(cat.slug); setPage(1); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                    category === cat.slug
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border)]",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range + Sort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">
                Time Range
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_RANGES.map((tr) => (
                  <button
                    key={tr.value}
                    onClick={() => { setTimeRange(tr.value); setPage(1); }}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-md transition-colors",
                      timeRange === tr.value
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)]",
                    )}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Source filter */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., CoinDesk, Decrypt..."
              className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>

          {/* Apply button */}
          <button
            onClick={() => search()}
            className="w-full py-2 text-sm font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
              Recent Searches
            </span>
            <button onClick={clearRecentSearches} className="text-[10px] text-[var(--color-text-tertiary)] hover:text-red-500">
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => { setQuery(s); search(s); }}
                className="px-3 py-1 text-xs rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 pb-4 border-b border-[var(--color-border)]">
              <div className="w-20 h-20 bg-[var(--color-surface-tertiary)] rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-16 bg-[var(--color-surface-tertiary)] rounded" />
                <div className="h-5 w-full bg-[var(--color-surface-tertiary)] rounded" />
                <div className="h-3 w-32 bg-[var(--color-surface-tertiary)] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;{query}&quot;
            {category !== "all" && ` in ${category}`}
          </p>
          <div className="space-y-4">
            {results.map((result, i) => (
              <a
                key={`${result.link}-${i}`}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 pb-4 border-b border-[var(--color-border)] last:border-b-0"
              >
                {result.imageUrl && (
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-[var(--color-surface-tertiary)] shrink-0">
                    <img
                      src={result.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Badge variant={categoryToBadgeVariant(result.category)} className="mb-1">
                    {result.category}
                  </Badge>
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                    {result.title}
                  </h3>
                  {result.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-1">
                      {result.description}
                    </p>
                  )}
                  <span className="text-[11px] text-[var(--color-text-tertiary)] mt-1 block">
                    {result.source} · {result.timeAgo}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Load more */}
          {results.length < totalResults && (
            <button
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                search(undefined, nextPage);
              }}
              className="w-full mt-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              Load More Results
            </button>
          )}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            No results found for &quot;{query}&quot;
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Try different keywords or adjust your filters
          </p>
        </div>
      )}
    </div>
  );
}

export default AdvancedSearchFilters;
