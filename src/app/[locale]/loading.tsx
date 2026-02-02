/**
 * Homepage Loading Skeleton
 * Full page skeleton shown during navigation and initial load
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

function NewsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 h-full">
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

function HeroSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-6 w-24 rounded-full bg-amber-500/20" />
          <Skeleton className="h-6 w-20 rounded-full bg-slate-700" />
        </div>
        <Skeleton className="h-10 w-full mb-2 bg-slate-700" />
        <Skeleton className="h-10 w-4/5 mb-4 bg-slate-700" />
        <Skeleton className="h-5 w-full mb-2 bg-slate-700" />
        <Skeleton className="h-5 w-3/4 mb-6 bg-slate-700" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24 bg-slate-700" />
          <Skeleton className="h-5 w-20 bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-28 rounded-xl flex-shrink-0" />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Trending Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Newsletter Skeleton */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6">
        <Skeleton className="h-6 w-36 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-full mb-4 bg-white/20" />
        <Skeleton className="h-10 w-full rounded-lg bg-white/20" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Price Ticker Skeleton */}
      <div className="bg-slate-900 py-2.5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16 bg-slate-700" />
                  <Skeleton className="h-5 w-20 bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breaking News Skeleton */}
      <div className="bg-red-600 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-4 w-96 bg-red-500" />
        </div>
      </div>

      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Skeleton */}
        <section className="mb-10">
          <HeroSkeleton />
        </section>

        {/* Categories Skeleton */}
        <section className="mb-8">
          <CategorySkeleton />
        </section>

        {/* Editors Picks Skeleton */}
        <section className="mb-10">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Main Content + Sidebar */}
        <div className="grid lg:grid-cols-[1fr,350px] gap-8">
          {/* News Grid Skeleton */}
          <section>
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          </section>

          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block">
            <SidebarSkeleton />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
