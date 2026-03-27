/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Skeleton } from '@/components/ui/Skeleton';

export default function CoinLoading() {
  return (
    <div className="container-main py-10">
      {/* Breadcrumbs skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Coin header skeleton */}
      <div className="mb-8 flex items-start gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-7 w-10 rounded-full" />
          </div>
          <div className="flex items-baseline gap-4">
            <Skeleton className="h-12 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Chart placeholder skeleton */}
      <div className="mb-10">
        <Skeleton className="h-92.5 w-full rounded-xl" />
      </div>

      {/* Stats grid skeleton */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-border rounded-lg border bg-(--color-surface) p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Description skeleton */}
      <div className="mb-10 space-y-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Related news skeleton */}
      <div>
        <Skeleton className="mb-4 h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-16/10 w-full rounded-lg" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
