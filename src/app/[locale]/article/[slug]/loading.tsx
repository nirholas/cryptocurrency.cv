/**
 * Article Page Loading Skeleton
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`} />;
}

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-12" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-24" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Article header skeleton */}
        <header className="mb-8">
          <Skeleton className="h-6 w-24 rounded-full mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-4/5 mb-3" />
          <Skeleton className="h-10 w-2/3 mb-6" />
          
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </header>

        {/* Article image skeleton */}
        <Skeleton className="w-full h-96 rounded-2xl mb-8" />

        {/* Article content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="h-6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Share buttons skeleton */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-lg ml-auto" />
        </div>
      </article>

      <Footer />
    </div>
  );
}
