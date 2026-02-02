/**
 * Developers Page Loading Skeleton
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

export default function DevelopersLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero skeleton */}
        <div className="text-center mb-12">
          <Skeleton className="h-6 w-32 mx-auto rounded-full mb-6" />
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[600px] mx-auto mb-2" />
          <Skeleton className="h-6 w-[500px] mx-auto mb-8" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex justify-center gap-2 mb-8">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Content skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
