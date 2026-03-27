/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Skeleton } from '@/components/ui/Skeleton';

export default function DefiLoading() {
  return (
    <div className="container-main py-10">
      {/* Page heading skeleton */}
      <Skeleton className="mb-2 h-10 w-64" />
      <Skeleton className="mb-8 h-5 w-120 max-w-full" />

      {/* Stats row skeleton — 6 cards */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border rounded-lg border bg-(--color-surface) p-4 md:p-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-5" />
            </div>
            <Skeleton className="mb-1 h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </section>

      {/* Chain distribution + category row */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <div className="border-border rounded-lg border bg-(--color-surface) p-6">
          <Skeleton className="mb-4 h-7 w-40" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
        <div className="border-border rounded-lg border bg-(--color-surface) p-6">
          <Skeleton className="mb-4 h-7 w-44" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
      </div>

      {/* Table section heading */}
      <Skeleton className="mb-4 h-8 w-52" />

      {/* Table skeleton */}
      <div className="border-border mb-10 overflow-hidden rounded-lg border bg-(--color-surface)">
        {/* Table header */}
        <div className="border-border bg-surface-secondary flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <div className="w-40 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-5 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* News section skeleton */}
      <Skeleton className="mb-4 h-7 w-36" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-16/10 w-full rounded-lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
