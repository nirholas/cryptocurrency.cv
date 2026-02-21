import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-56 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />

        {/* Filter/search bar */}
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Data table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            {['#', 'Name', 'Price', '24h', '7d', 'Market Cap', 'Volume'].map((col) => (
              <Skeleton key={col} className="h-4 w-16" />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b border-gray-50 dark:border-slate-700/50">
              <Skeleton className="h-4 w-6" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-lg" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
