/**
 * @fileoverview Infinite Scroll Component
 * 
 * Loads more articles automatically when scrolling near bottom.
 * Uses Intersection Observer for efficient scroll detection.
 * 
 * @module components/InfiniteScroll
 * 
 * @example
 * <InfiniteScroll
 *   loadMore={fetchMoreArticles}
 *   hasMore={hasMorePages}
 *   loading={isLoading}
 * >
 *   {articles.map(article => <NewsCard key={article.id} article={article} />)}
 * </InfiniteScroll>
 * 
 * @features
 * - Intersection Observer for performance
 * - Loading spinner indicator
 * - End of content message
 * - Customizable threshold
 */
'use client';

import { useEffect, useRef, useCallback, ReactNode } from 'react';

interface InfiniteScrollProps {
  children: ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  className?: string;
  endMessage?: ReactNode;
}

export default function InfiniteScroll({
  children,
  loadMore,
  hasMore,
  loading,
  threshold = 0.1,
  className = '',
  endMessage,
}: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleObserver = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && !loadingRef.current) {
        loadingRef.current = true;
        await loadMore();
        loadingRef.current = false;
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return (
    <div className={className}>
      {children}
      
      {/* Observer target */}
      <div ref={observerRef} className="w-full h-4" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">Loading more articles...</span>
          </div>
        </div>
      )}
      
      {/* End message */}
      {!hasMore && !loading && (
        endMessage || (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">You&apos;re all caught up!</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Hook for infinite scroll state management
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ items: T[]; hasMore: boolean }>,
  initialPage = 1
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn(page);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return { items, hasMore, loading, error, loadMore, reset };
}

// Need to import useState for the hook
import { useState } from 'react';
