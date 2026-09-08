/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Skeleton } from '@/components/ui';

/** Structural placeholder shown while the reference route resolves. */
export function ExplorerSkeleton() {
  return (
    <div className="min-h-screen bg-surface-secondary" aria-busy="true" aria-label="Loading API reference">
      <header className="border-b border-border bg-(--color-surface)">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-7 w-72" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_minmax(340px,420px)]">
        <div className="rounded-lg border border-border bg-(--color-surface) p-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-14 rounded-full" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-(--color-surface) p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-7 w-2/3" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
          <div className="rounded-lg border border-border bg-(--color-surface) p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-32 w-full rounded-md" />
          </div>
          <div className="rounded-lg border border-border bg-(--color-surface) p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-40 w-full rounded-md" />
          </div>
        </div>

        <div className="lg:col-span-2 xl:col-span-1">
          <div className="rounded-lg border border-border bg-(--color-surface) p-3">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="mt-3 h-64 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
