/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Skeleton } from '@/components/ui/Skeleton';

export default function MarketsLoading() {
  return (
    <div className="container-main py-10">
      {/* Page heading skeleton */}
      <Skeleton className="mb-2 h-10 w-40" />
      <Skeleton className="mb-8 h-5 w-96 max-w-full" />

      {/* Stats bar skeleton — 6 cards */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border rounded-lg border bg-(--color-surface) p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </div>
        ))}
      </section>

      {/* Table heading skeleton */}
      <Skeleton className="mb-4 h-7 w-52" />

      {/* Table skeleton */}
      <div className="border-border overflow-hidden rounded-lg border bg-(--color-surface)">
        {/* Table header */}
        <div className="border-border bg-surface-secondary flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="w-32 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="ml-auto h-5 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
