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
        {/* Coin header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-10 w-40 ml-auto" />
        </div>

        {/* Price + change */}
        <div className="flex items-baseline gap-4 mb-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Chart area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-8">
          <div className="flex gap-2 mb-4">
            {['1H', '1D', '1W', '1M', '1Y'].map((label) => (
              <Skeleton key={label} className="h-8 w-14 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Info grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>

        {/* News section */}
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
