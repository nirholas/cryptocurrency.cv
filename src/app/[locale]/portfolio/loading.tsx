import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-72 mb-8" />

        {/* Portfolio summary cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-40 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Allocation chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-8">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-48 w-48 rounded-full mx-auto" />
        </div>

        {/* Holdings table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-100 dark:border-slate-700 mb-3">
            {['Asset', 'Price', 'Holdings', 'Value', 'PnL'].map((col) => (
              <Skeleton key={col} className="h-4 w-16" />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
