/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Route-level loading skeletons shared by the `loading.tsx` files of pages
 * whose server work can take seconds on a cold cache. Each mirrors the layout
 * of the page it stands in for so the swap to real content does not shift.
 */

import { Skeleton } from '@/components/ui/Skeleton';

function HeadingSkeleton() {
  return (
    <div className="mb-10">
      <Skeleton className="mb-4 h-1 w-16 rounded-full" />
      <Skeleton className="mb-2 h-10 w-72 max-w-full" />
      <Skeleton className="h-5 w-120 max-w-full" />
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-16/10 w-full rounded-lg" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/** Featured article plus a responsive card grid: category, tag, vertical, opinion pages. */
export function ArticleGridSkeleton({ cards = 9 }: { cards?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading articles">
      <HeadingSkeleton />
      <div className="border-border mb-10 grid gap-8 border-b pb-10 md:grid-cols-2">
        <Skeleton className="aspect-16/10 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Stat cards, a wide panel, and a table: derivatives, ethereum, regulation, digest, explore. */
export function DashboardSkeleton({ stats = 4, rows = 8 }: { stats?: number; rows?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading dashboard">
      <HeadingSkeleton />
      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="border-border rounded-lg border bg-(--color-surface) p-4">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </section>
      <Skeleton className="mb-10 h-72 w-full rounded-xl" />
      <div className="border-border overflow-hidden rounded-lg border bg-(--color-surface)">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Uniform card grid: the authors directory. */
export function CardGridSkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading directory">
      <HeadingSkeleton />
      <div className="mb-8 flex gap-4">
        <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
        <Skeleton className="h-8 w-56 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="border-border flex gap-3 rounded-lg border p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Filter bar over a dense market table: screener, whales, L2, arbitrage, stablecoins, unlocks, exchanges, watchlist. */
export function MarketTableSkeleton({
  rows = 12,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading table">
      <HeadingSkeleton />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-72 max-w-full rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="ml-auto h-10 w-28 rounded-lg" />
      </div>
      <div className="border-border overflow-hidden rounded-lg border bg-(--color-surface)">
        <div className="border-border bg-surface-secondary flex items-center gap-4 border-b px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={i === 0 ? 'h-4 w-32' : 'ml-auto h-4 w-20'} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="border-border flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="w-32 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <Skeleton key={c} className="ml-auto h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A hero metric beside a chart, then a supporting card row: gas, fear & greed, sentiment. */
export function MetricsPanelSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading metrics">
      <HeadingSkeleton />
      <div className="mb-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="border-border flex flex-col items-center gap-4 rounded-xl border bg-(--color-surface) p-8">
          <Skeleton className="h-44 w-44 rounded-full" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="border-border rounded-lg border bg-(--color-surface) p-5">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="mb-2 h-8 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A dense grid of equally weighted tiles: the market heatmap. */
export function TileGridSkeleton({ tiles = 48 }: { tiles?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading heatmap">
      <HeadingSkeleton />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: tiles }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** A stacked list of rows under a toolbar: search results, saved alerts. */
export function FeedSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="container-main py-10" aria-busy="true" aria-label="Loading results">
      <HeadingSkeleton />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-full max-w-xl rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-border flex gap-4 rounded-lg border p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
