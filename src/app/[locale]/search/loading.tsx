/**
 * Search Page Loading Skeleton
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Input Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Results Skeleton */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
              <div className="flex gap-4">
                <Skeleton className="w-1 h-16 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
