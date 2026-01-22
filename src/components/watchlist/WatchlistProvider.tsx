'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getWatchlist,
  saveWatchlist,
  WatchlistItem,
  exportWatchlist as exportWatchlistData,
  importWatchlist as importWatchlistData,
  exportWatchlistAsCSV,
  MAX_WATCHLIST_SIZE,
} from '@/lib/watchlist';

const MAX_WATCHLIST_SIZE_CONST = 100;

interface WatchlistContextType {
  watchlist: string[];
  addToWatchlist: (coinId: string) => { success: boolean; error?: string };
  removeFromWatchlist: (coinId: string) => void;
  isWatchlisted: (coinId: string) => boolean;
  clearWatchlist: () => void;
  reorderWatchlist: (coinIds: string[]) => void;
  exportWatchlist: () => string;
  exportWatchlistCSV: () => string;
  importWatchlist: (data: string) => { success: boolean; imported: number; error?: string };
  isLoaded: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
}

interface WatchlistProviderProps {
  children: ReactNode;
}

export function WatchlistProvider({ children }: WatchlistProviderProps) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load watchlist on mount
  useEffect(() => {
    const items = getWatchlist();
    setWatchlistItems(items);
    setIsLoaded(true);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crypto-watchlist') {
        try {
          const newItems = e.newValue ? JSON.parse(e.newValue) : [];
          setWatchlistItems(newItems);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Get array of coin IDs
  const watchlist = watchlistItems.map(item => item.coinId);

  const addToWatchlist = useCallback((coinId: string) => {
    if (watchlistItems.some(item => item.coinId === coinId)) {
      return { success: false, error: 'Already in watchlist' };
    }

    if (watchlistItems.length >= MAX_WATCHLIST_SIZE_CONST) {
      return { success: false, error: `Watchlist is full (max ${MAX_WATCHLIST_SIZE_CONST} coins)` };
    }

    const newItem: WatchlistItem = {
      coinId,
      addedAt: new Date().toISOString(),
    };

    const newItems = [newItem, ...watchlistItems];
    setWatchlistItems(newItems);
    saveWatchlist(newItems);

    return { success: true };
  }, [watchlistItems]);

  const removeFromWatchlist = useCallback((coinId: string) => {
    const newItems = watchlistItems.filter(item => item.coinId !== coinId);
    setWatchlistItems(newItems);
    saveWatchlist(newItems);
  }, [watchlistItems]);

  const isWatchlisted = useCallback((coinId: string) => {
    return watchlistItems.some(item => item.coinId === coinId);
  }, [watchlistItems]);

  const clearWatchlist = useCallback(() => {
    setWatchlistItems([]);
    saveWatchlist([]);
  }, []);

  const reorderWatchlist = useCallback((coinIds: string[]) => {
    const reordered = coinIds
      .map(id => watchlistItems.find(item => item.coinId === id))
      .filter((item): item is WatchlistItem => !!item);
    
    setWatchlistItems(reordered);
    saveWatchlist(reordered);
  }, [watchlistItems]);

  const exportWatchlist = useCallback(() => {
    return exportWatchlistData();
  }, []);

  const exportWatchlistCSV = useCallback(() => {
    return exportWatchlistAsCSV();
  }, []);

  const importWatchlist = useCallback((data: string) => {
    const result = importWatchlistData(data);
    if (result.success) {
      // Reload watchlist after import
      const items = getWatchlist();
      setWatchlistItems(items);
    }
    return result;
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isWatchlisted,
        clearWatchlist,
        reorderWatchlist,
        exportWatchlist,
        exportWatchlistCSV,
        importWatchlist,
        isLoaded,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export default WatchlistProvider;
