/**
 * Watchlist Management
 * 
 * Features:
 * - Track favorite coins
 * - Persist to localStorage
 * - Sync across tabs
 * - Import/Export functionality
 */

export interface WatchlistItem {
  coinId: string;
  addedAt: string;
}

export interface WatchlistExport {
  version: 1;
  exportedAt: string;
  coins: string[];
}

const STORAGE_KEY = 'crypto-watchlist';
export const MAX_WATCHLIST_SIZE = 100;

/**
 * Get watchlist from localStorage
 */
export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as WatchlistItem[];
  } catch {
    return [];
  }
}

/**
 * Save watchlist to localStorage
 */
export function saveWatchlist(watchlist: WatchlistItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Failed to save watchlist:', error);
  }
}

/**
 * Add coin to watchlist
 */
export function addToWatchlist(coinId: string): { success: boolean; error?: string } {
  const watchlist = getWatchlist();
  
  if (watchlist.some(item => item.coinId === coinId)) {
    return { success: false, error: 'Already in watchlist' };
  }
  
  if (watchlist.length >= MAX_WATCHLIST_SIZE) {
    return { success: false, error: `Watchlist is full (max ${MAX_WATCHLIST_SIZE} coins)` };
  }
  
  const newItem: WatchlistItem = {
    coinId,
    addedAt: new Date().toISOString(),
  };
  
  saveWatchlist([newItem, ...watchlist]);
  return { success: true };
}

/**
 * Remove coin from watchlist
 */
export function removeFromWatchlist(coinId: string): boolean {
  const watchlist = getWatchlist();
  const filtered = watchlist.filter(item => item.coinId !== coinId);
  
  if (filtered.length === watchlist.length) {
    return false;
  }
  
  saveWatchlist(filtered);
  return true;
}

/**
 * Check if coin is in watchlist
 */
export function isInWatchlist(coinId: string): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(item => item.coinId === coinId);
}

/**
 * Reorder watchlist
 */
export function reorderWatchlist(coinIds: string[]): void {
  const watchlist = getWatchlist();
  const reordered = coinIds
    .map(id => watchlist.find(item => item.coinId === id))
    .filter((item): item is WatchlistItem => !!item);
  
  saveWatchlist(reordered);
}

/**
 * Clear entire watchlist
 */
export function clearWatchlist(): void {
  saveWatchlist([]);
}

/**
 * Export watchlist to JSON string
 */
export function exportWatchlist(): string {
  const watchlist = getWatchlist();
  const exportData: WatchlistExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    coins: watchlist.map(item => item.coinId),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import watchlist from JSON string
 */
export function importWatchlist(data: string): { success: boolean; imported: number; error?: string } {
  try {
    const parsed = JSON.parse(data) as WatchlistExport;
    
    if (parsed.version !== 1) {
      return { success: false, imported: 0, error: 'Unsupported export version' };
    }
    
    if (!Array.isArray(parsed.coins)) {
      return { success: false, imported: 0, error: 'Invalid export format' };
    }
    
    const existingWatchlist = getWatchlist();
    const existingIds = new Set(existingWatchlist.map(item => item.coinId));
    
    let imported = 0;
    const newItems: WatchlistItem[] = [];
    
    for (const coinId of parsed.coins) {
      if (typeof coinId !== 'string' || !coinId.trim()) continue;
      if (existingIds.has(coinId)) continue;
      if (existingWatchlist.length + newItems.length >= MAX_WATCHLIST_SIZE) break;
      
      newItems.push({
        coinId: coinId.trim(),
        addedAt: new Date().toISOString(),
      });
      imported++;
    }
    
    saveWatchlist([...existingWatchlist, ...newItems]);
    
    return { success: true, imported };
  } catch {
    return { success: false, imported: 0, error: 'Invalid JSON format' };
  }
}

/**
 * Export watchlist to CSV
 */
export function exportWatchlistAsCSV(): string {
  const watchlist = getWatchlist();
  const header = 'Coin ID,Added At';
  const rows = watchlist.map(item => `${item.coinId},${item.addedAt}`);
  return [header, ...rows].join('\n');
}
