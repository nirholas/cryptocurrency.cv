/**
 * Markets Page Loading Skeleton
 * Full page skeleton shown during server-side data fetching
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

export default function MarketsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Global Stats Bar Skeleton */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 py-3 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2 px-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <main className="px-4 py-6">
          {/* Page Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Trending Section Skeleton */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Trending Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
            {/* Gainers/Losers Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-36 rounded-lg" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20 hidden sm:block" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Tabs Skeleton */}
          <div className="flex gap-2 mb-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Skeleton 
                key={i} 
                className={`h-10 rounded-full flex-shrink-0 ${i === 1 ? 'w-16' : 'w-24'}`} 
              />
            ))}
          </div>

          {/* Search and Filters Skeleton */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Skeleton className="h-11 w-64 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>

          {/* Coins Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center p-4 gap-4">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-4 w-14 hidden sm:block" />
                <Skeleton className="h-4 w-12 hidden md:block" />
                <Skeleton className="h-4 w-20 hidden lg:block" />
                <Skeleton className="h-4 w-20 hidden xl:block" />
                <Skeleton className="h-4 w-24 hidden xl:block" />
                <Skeleton className="h-4 w-20 hidden lg:block" />
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex items-center p-4 gap-4">
                  <Skeleton className="h-4 w-6" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-4 w-14 hidden sm:block" />
                  <Skeleton className="h-4 w-14 hidden md:block" />
                  <Skeleton className="h-4 w-20 hidden lg:block" />
                  <Skeleton className="h-4 w-20 hidden xl:block" />
                  <Skeleton className="h-4 w-24 hidden xl:block" />
                  <Skeleton className="h-8 w-24 hidden lg:block" />
                  <Skeleton className="h-5 w-5 rounded hidden" />
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-10 w-20 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-lg hidden sm:block" />
                <Skeleton className="h-10 w-10 rounded-lg hidden sm:block" />
                <Skeleton className="h-10 w-10 rounded-lg hidden sm:block" />
                <Skeleton className="h-10 w-10 rounded-lg hidden sm:block" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-32 rounded-lg hidden lg:block" />
            </div>
          </div>

          {/* Data Attribution Skeleton */}
          <div className="mt-8 text-center">
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
