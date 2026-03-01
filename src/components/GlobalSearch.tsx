'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Loader2,
  X,
  ExternalLink,
  TrendingUp,
  Clock,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useDebounce } from '@/hooks/useDebounce';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchResult {
  title: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  timeAgo: string;
  description?: string;
}

interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Category filter tabs                                               */
/* ------------------------------------------------------------------ */

const CATEGORY_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Bitcoin', value: 'bitcoin' },
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'DeFi', value: 'defi' },
  { label: 'Regulation', value: 'regulation' },
  { label: 'Altcoins', value: 'altcoins' },
] as const;

/* ------------------------------------------------------------------ */
/*  localStorage helpers for recent searches                           */
/* ------------------------------------------------------------------ */

const RECENT_KEY = 'fcn-recent-searches';
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Highlight matching text                                            */
/* ------------------------------------------------------------------ */

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const words = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState('');
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Count of navigable items (results, or trending + recent in idle state)
  const navigableCount = useMemo(() => {
    if (debouncedQuery.trim()) return results.length;
    return trending.length + recentSearches.length;
  }, [debouncedQuery, results.length, trending.length, recentSearches.length]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setActiveIndex(0);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      search: debouncedQuery,
      limit: '12',
    });
    if (category) params.set('category', category);

    fetch(`/api/news?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data.articles ?? []);
        setActiveIndex(0);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setResults([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, category]);

  // Load trending topics on open
  useEffect(() => {
    if (!open) return;
    setRecentSearches(getRecentSearches());

    const controller = new AbortController();
    fetch('/api/trending', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.topics)) {
          setTrending(data.topics.slice(0, 8));
        } else if (Array.isArray(data)) {
          setTrending(data.slice(0, 8));
        }
      })
      .catch(() => {
        // non-critical
      });

    return () => controller.abort();
  }, [open]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setCategory('');
    }
  }, [open]);

  // Navigate to result
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query || result.title);
      onOpenChange(false);
      if (result.link.startsWith('http')) {
        window.open(result.link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = result.link;
      }
    },
    [onOpenChange, query],
  );

  // Use a trending/recent item as search query
  const useSearchTerm = useCallback(
    (term: string) => {
      setQuery(term);
      inputRef.current?.focus();
    },
    [],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, navigableCount - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (debouncedQuery.trim() && results[activeIndex]) {
            navigateToResult(results[activeIndex]);
          } else if (!debouncedQuery.trim()) {
            // Select from trending or recent
            if (activeIndex < trending.length) {
              useSearchTerm(trending[activeIndex].topic);
            } else {
              const recentIdx = activeIndex - trending.length;
              if (recentSearches[recentIdx]) useSearchTerm(recentSearches[recentIdx]);
            }
          }
          break;
        case 'Tab':
          // Cycle through category filters
          e.preventDefault();
          setCategory((prev) => {
            const currentIdx = CATEGORY_FILTERS.findIndex((c) => c.value === prev);
            const nextIdx = (currentIdx + (e.shiftKey ? -1 : 1) + CATEGORY_FILTERS.length) % CATEGORY_FILTERS.length;
            return CATEGORY_FILTERS[nextIdx].value;
          });
          break;
      }
    },
    [results, activeIndex, navigateToResult, debouncedQuery, trending, recentSearches, useSearchTerm, navigableCount],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const sentimentColor = (s: string) => {
    if (s === 'bullish') return 'text-emerald-500';
    if (s === 'bearish') return 'text-red-500';
    return 'text-[var(--color-text-tertiary)]';
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-150" />
        <Dialog.Content
          className="fixed left-1/2 top-[12%] z-[101] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-all duration-150 flex flex-col max-h-[75vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 shrink-0">
            <Search className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news, topics, coins…"
              className="flex-1 bg-transparent text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
              autoFocus
            />
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-tertiary)]" />
            )}
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Dialog.Close asChild>
              <button
                className="rounded-md px-2 py-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                aria-label="Close search"
              >
                esc
              </button>
            </Dialog.Close>
          </div>

          {/* Category filter tabs */}
          {debouncedQuery.trim() && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-border)] overflow-x-auto shrink-0">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                    category === cat.value
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]',
                  )}
                >
                  {cat.label}
                </button>
              ))}
              <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)] shrink-0 hidden sm:inline">
                Tab to switch
              </span>
            </div>
          )}

          {/* Scrollable results area */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            {/* ---- Idle state: trending + recent ---- */}
            {!debouncedQuery.trim() && (
              <div className="py-2">
                {/* Trending topics */}
                {trending.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Trending
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trending.map((t, i) => (
                        <button
                          key={t.topic}
                          onClick={() => useSearchTerm(t.topic)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border',
                            i === activeIndex
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50',
                          )}
                        >
                          <Hash className="h-3 w-3 opacity-50" />
                          {t.topic}
                          {t.count > 1 && (
                            <span className={cn('text-[10px] font-mono', sentimentColor(t.sentiment))}>
                              {t.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="px-4 py-2 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Recent
                        </span>
                      </div>
                      <button
                        onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                        className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((term, i) => {
                        const idx = trending.length + i;
                        return (
                          <button
                            key={term}
                            onClick={() => useSearchTerm(term)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              'flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-sm text-left transition-colors cursor-pointer',
                              idx === activeIndex
                                ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]',
                            )}
                          >
                            <Clock className="h-3.5 w-3.5 opacity-40 shrink-0" />
                            <span className="truncate">{term}</span>
                            <ArrowRight className="h-3 w-3 ml-auto opacity-30 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty idle state */}
                {trending.length === 0 && recentSearches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-tertiary)]">
                    <Search className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">Start typing to search…</p>
                  </div>
                )}

                {/* Shortcuts hint */}
                <div className="px-4 pt-3 pb-2 mt-1 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-tertiary)]">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-mono">↑↓</kbd>
                      navigate
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-mono">↵</kbd>
                      select
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-mono">Tab</kbd>
                      filter
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-mono">esc</kbd>
                      close
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ---- No results ---- */}
            {debouncedQuery.trim() && !loading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-tertiary)]">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                <p className="text-xs mt-1 opacity-60">
                  {category ? 'Try removing the category filter or ' : 'Try '}a different search term
                </p>
              </div>
            )}

            {/* ---- Loading skeleton ---- */}
            {debouncedQuery.trim() && loading && results.length === 0 && (
              <div className="px-4 py-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full rounded bg-[var(--color-border)] animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-[var(--color-border)] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- Result list ---- */}
            {results.map((result, i) => (
              <button
                key={`${result.link}-${i}`}
                onClick={() => navigateToResult(result)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer group',
                  i === activeIndex
                    ? 'bg-[var(--color-accent)]/10'
                    : 'hover:bg-[var(--color-surface-secondary)]',
                )}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium leading-snug line-clamp-2',
                      i === activeIndex
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-primary)]',
                    )}
                  >
                    <HighlightText text={result.title} query={debouncedQuery} />
                  </p>
                  {result.description && (
                    <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)] line-clamp-1">
                      <HighlightText text={result.description} query={debouncedQuery} />
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                    <span className="font-medium">{result.source}</span>
                    <span className="opacity-30">·</span>
                    <span>{result.timeAgo || formatTimeAgo(result.pubDate)}</span>
                    <Badge className="ml-1 text-[10px]">
                      {result.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {result.link.startsWith('http') && (
                    <ExternalLink className="h-3.5 w-3.5 mt-1 shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <ArrowRight className={cn(
                    'h-3.5 w-3.5 mt-1 shrink-0 transition-all',
                    i === activeIndex ? 'opacity-100 text-[var(--color-accent)] translate-x-0' : 'opacity-0 -translate-x-1',
                  )} />
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)] shrink-0">
              <span>
                {results.length} result{results.length !== 1 ? 's' : ''}
                {category && (
                  <> in <span className="font-medium">{CATEGORY_FILTERS.find(c => c.value === category)?.label}</span></>
                )}
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-mono text-[10px]">↵</kbd>
                to open
              </span>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
