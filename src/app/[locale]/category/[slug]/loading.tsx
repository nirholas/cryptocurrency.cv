/**
 * Category Page Loading Skeleton
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

function NewsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-4/5 mb-2" />
      <Skeleton className="h-5 w-3/5 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Category header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg ml-auto" />
        </div>

        {/* News grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-center gap-2 mt-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
