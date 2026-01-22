'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useWatchlist } from './WatchlistProvider';
import { useToast } from '@/components/Toast';

interface WatchlistButtonProps {
  coinId: string;
  coinName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function WatchlistButton({ 
  coinId, 
  coinName,
  size = 'md', 
  showLabel = false,
  className = '' 
}: WatchlistButtonProps) {
  const { isWatchlisted, addToWatchlist, removeFromWatchlist, isLoaded } = useWatchlist();
  const { addToast } = useToast();
  
  const isInWatchlist = isWatchlisted(coinId);
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoaded) return;
    
    if (isInWatchlist) {
      removeFromWatchlist(coinId);
      addToast({
        type: 'info',
        title: 'Removed from watchlist',
        message: coinName ? `${coinName} removed` : undefined,
        duration: 3000,
      });
    } else {
      const result = addToWatchlist(coinId);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Added to watchlist',
          message: coinName ? `${coinName} added` : undefined,
          duration: 3000,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Failed to add',
          message: result.error,
          duration: 4000,
        });
      }
    }
  };

  if (!isLoaded) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} rounded-lg text-gray-300 dark:text-gray-600 ${className}`}
        aria-label="Loading watchlist"
      >
        <Star className={`${iconSizes[size]} animate-pulse`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]} 
        rounded-lg
        transition-all duration-200
        ${isInWatchlist 
          ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20' 
          : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        focus:outline-none focus:ring-2 focus:ring-yellow-500/50
        ${className}
      `}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={isInWatchlist}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <div className="flex items-center gap-2">
        <Star 
          className={`${iconSizes[size]} transition-all ${isInWatchlist ? 'fill-current' : ''}`} 
        />
        {showLabel && (
          <span className="text-sm font-medium">
            {isInWatchlist ? 'Watching' : 'Watch'}
          </span>
        )}
      </div>
    </button>
  );
}

export default WatchlistButton;
