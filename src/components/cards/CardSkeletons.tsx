/**
 * Card Skeleton Loading Components
 * Skeleton states for each card variant
 */

import React from 'react';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ArticleCardLargeSkeleton() {
  return (
    <div className="h-[400px] flex bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-none dark:border dark:border-gray-800 overflow-hidden">
      {/* Image placeholder */}
      <div className="w-[40%] flex-shrink-0">
        <Skeleton className="h-full w-full" />
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-full rounded" />
          <Skeleton className="h-7 w-3/4 rounded" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ArticleCardMediumSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-none dark:border dark:border-gray-800 overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="h-[200px] w-full" />
      
      {/* Content */}
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-2/3 rounded" />
        
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ArticleCardSmallSkeleton({ showRank = false }: { showRank?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900">
      {showRank ? (
        <Skeleton className="flex-shrink-0 w-7 h-7 rounded-lg" />
      ) : (
        <Skeleton className="flex-shrink-0 w-1.5 h-12 rounded-full" />
      )}
      
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ArticleCardListSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
      {/* Image */}
      <Skeleton className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg" />
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded hidden sm:block" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

// Grid skeleton for Posts component
export function ArticleGridSkeleton({ 
  count = 6, 
  variant = 'medium' 
}: { 
  count?: number; 
  variant?: 'large' | 'medium' | 'small' | 'list';
}) {
  const gridClasses = {
    large: 'flex flex-col gap-6 p-4 md:p-6',
    medium: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6',
    small: 'flex flex-col gap-2 p-4',
    list: 'flex flex-col gap-4 p-4 md:p-6',
  };

  const SkeletonComponent = {
    large: ArticleCardLargeSkeleton,
    medium: ArticleCardMediumSkeleton,
    small: ArticleCardSmallSkeleton,
    list: ArticleCardListSkeleton,
  }[variant];

  return (
    <div 
      className={gridClasses[variant]}
      role="status"
      aria-label="Loading articles..."
    >
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
