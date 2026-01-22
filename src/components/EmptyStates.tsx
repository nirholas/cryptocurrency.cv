'use client';

/**
 * @fileoverview Empty State Components
 * 
 * Reusable empty state components for various list types throughout the application.
 * Provides consistent, visually appealing empty states with helpful actions.
 * 
 * @module components/EmptyStates
 */

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common use cases

export function EmptyWatchlist({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<span>⭐</span>}
      title="Your watchlist is empty"
      description="Start adding cryptocurrencies to your watchlist to track their prices and performance."
      action={{
        label: 'Browse Coins',
        href: '/trending',
      }}
      secondaryAction={onBrowse ? {
        label: 'Explore Markets',
        onClick: onBrowse,
      } : undefined}
    />
  );
}

export function EmptyPortfolio({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<span>💼</span>}
      title="No holdings yet"
      description="Add your first cryptocurrency holding to start tracking your portfolio's performance."
      action={onAdd ? {
        label: 'Add Holding',
        onClick: onAdd,
      } : undefined}
      secondaryAction={{
        label: 'Import Portfolio',
        href: '/portfolio?import=true',
      }}
    />
  );
}

export function EmptyAlerts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<span>🔔</span>}
      title="No price alerts"
      description="Set up price alerts to get notified when cryptocurrencies reach your target prices."
      action={onAdd ? {
        label: 'Create Alert',
        onClick: onAdd,
      } : {
        label: 'Browse Coins',
        href: '/trending',
      }}
    />
  );
}

export function EmptyBookmarks() {
  return (
    <EmptyState
      icon={<span>📑</span>}
      title="No bookmarked articles"
      description="Save interesting articles to read later by clicking the bookmark icon."
      action={{
        label: 'Browse News',
        href: '/',
      }}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<span>🔍</span>}
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or browse our trending topics."
      action={{
        label: 'View Trending',
        href: '/trending',
      }}
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      icon={<span>📊</span>}
      title="No transactions"
      description="Add buy or sell transactions to track your trading history."
    />
  );
}

export function EmptyCompare({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<span>⚖️</span>}
      title="Compare Cryptocurrencies"
      description="Select up to 5 cryptocurrencies to compare their prices, market caps, and performance."
      action={onAdd ? {
        label: 'Add Coin',
        onClick: onAdd,
      } : {
        label: 'Browse Coins',
        href: '/trending',
      }}
    />
  );
}

export function EmptyNews() {
  return (
    <EmptyState
      icon={<span>📰</span>}
      title="No news available"
      description="There are no news articles at the moment. Check back soon for the latest crypto updates."
      action={{
        label: 'Refresh',
        onClick: () => window.location.reload(),
      }}
    />
  );
}

// Error state that can be used when data loading fails
export function DataError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Failed to load data"
      description="There was a problem loading the data. Please check your connection and try again."
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : {
        label: 'Refresh Page',
        onClick: () => window.location.reload(),
      }}
    />
  );
}

// Rate limit error state
export function RateLimitError({ retryAfter }: { retryAfter?: number }) {
  return (
    <EmptyState
      icon={<span>⏱️</span>}
      title="Too many requests"
      description={retryAfter 
        ? `Please wait ${retryAfter} seconds before trying again.`
        : "We've received too many requests. Please wait a moment and try again."
      }
      action={{
        label: 'Wait & Retry',
        onClick: () => {
          setTimeout(() => window.location.reload(), (retryAfter || 30) * 1000);
        },
      }}
    />
  );
}

// Offline state for when there's no cached data
export function OfflineState() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
      }
      title="You're offline"
      description="This content isn't available offline. Please connect to the internet to view the latest data."
      action={{
        label: 'Retry',
        onClick: () => window.location.reload(),
      }}
    />
  );
}

export default EmptyState;
