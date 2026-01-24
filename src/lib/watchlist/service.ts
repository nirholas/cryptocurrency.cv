/**
 * Watchlist Service
 * 
 * Handles user watchlist management with Vercel KV storage.
 * Features:
 * - Add/remove coins from watchlist
 * - Get user's watchlist
 * - Check if coin is in watchlist
 * - Bulk operations
 */

import { kv } from '@vercel/kv';

// =============================================================================
// Types
// =============================================================================

export interface WatchlistItem {
  coinId: string;
  symbol: string;
  name: string;
  addedAt: string;
  priceAtAdd?: number;
  notes?: string;
}

export interface Watchlist {
  userId: string;
  items: WatchlistItem[];
  updatedAt: string;
}

export interface WatchlistStats {
  totalCoins: number;
  topGainers: WatchlistItem[];
  topLosers: WatchlistItem[];
}

// =============================================================================
// Storage Keys
// =============================================================================

const getWatchlistKey = (userId: string) => `watchlist:${userId}`;
const getWatchlistIndexKey = () => `watchlist:index`;

// =============================================================================
// In-Memory Fallback (Development)
// =============================================================================

const inMemoryWatchlists = new Map<string, Watchlist>();

// =============================================================================
// Watchlist Operations
// =============================================================================

/**
 * Get user's watchlist
 */
export async function getWatchlist(userId: string): Promise<Watchlist> {
  try {
    const key = getWatchlistKey(userId);
    const watchlist = await kv.get<Watchlist>(key);
    
    if (watchlist) {
      return watchlist;
    }
  } catch (error) {
    console.warn('KV not available, using in-memory storage:', error);
    const cached = inMemoryWatchlists.get(userId);
    if (cached) return cached;
  }
  
  // Return empty watchlist
  return {
    userId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add coin to watchlist
 */
export async function addToWatchlist(
  userId: string,
  item: Omit<WatchlistItem, 'addedAt'>
): Promise<Watchlist> {
  const watchlist = await getWatchlist(userId);
  
  // Check if already in watchlist
  const exists = watchlist.items.some(i => i.coinId === item.coinId);
  if (exists) {
    return watchlist;
  }
  
  const newItem: WatchlistItem = {
    ...item,
    addedAt: new Date().toISOString(),
  };
  
  watchlist.items.push(newItem);
  watchlist.updatedAt = new Date().toISOString();
  
  await saveWatchlist(userId, watchlist);
  return watchlist;
}

/**
 * Remove coin from watchlist
 */
export async function removeFromWatchlist(
  userId: string,
  coinId: string
): Promise<Watchlist> {
  const watchlist = await getWatchlist(userId);
  
  watchlist.items = watchlist.items.filter(i => i.coinId !== coinId);
  watchlist.updatedAt = new Date().toISOString();
  
  await saveWatchlist(userId, watchlist);
  return watchlist;
}

/**
 * Check if coin is in watchlist
 */
export async function isInWatchlist(
  userId: string,
  coinId: string
): Promise<boolean> {
  const watchlist = await getWatchlist(userId);
  return watchlist.items.some(i => i.coinId === coinId);
}

/**
 * Toggle coin in watchlist
 */
export async function toggleWatchlist(
  userId: string,
  item: Omit<WatchlistItem, 'addedAt'>
): Promise<{ watchlist: Watchlist; added: boolean }> {
  const isIn = await isInWatchlist(userId, item.coinId);
  
  if (isIn) {
    const watchlist = await removeFromWatchlist(userId, item.coinId);
    return { watchlist, added: false };
  } else {
    const watchlist = await addToWatchlist(userId, item);
    return { watchlist, added: true };
  }
}

/**
 * Update watchlist item notes
 */
export async function updateWatchlistItem(
  userId: string,
  coinId: string,
  updates: Partial<Pick<WatchlistItem, 'notes'>>
): Promise<Watchlist> {
  const watchlist = await getWatchlist(userId);
  
  const itemIndex = watchlist.items.findIndex(i => i.coinId === coinId);
  if (itemIndex === -1) {
    throw new Error('Item not in watchlist');
  }
  
  watchlist.items[itemIndex] = {
    ...watchlist.items[itemIndex],
    ...updates,
  };
  watchlist.updatedAt = new Date().toISOString();
  
  await saveWatchlist(userId, watchlist);
  return watchlist;
}

/**
 * Clear entire watchlist
 */
export async function clearWatchlist(userId: string): Promise<Watchlist> {
  const watchlist: Watchlist = {
    userId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
  
  await saveWatchlist(userId, watchlist);
  return watchlist;
}

/**
 * Bulk add to watchlist
 */
export async function bulkAddToWatchlist(
  userId: string,
  items: Omit<WatchlistItem, 'addedAt'>[]
): Promise<Watchlist> {
  const watchlist = await getWatchlist(userId);
  
  for (const item of items) {
    const exists = watchlist.items.some(i => i.coinId === item.coinId);
    if (!exists) {
      watchlist.items.push({
        ...item,
        addedAt: new Date().toISOString(),
      });
    }
  }
  
  watchlist.updatedAt = new Date().toISOString();
  await saveWatchlist(userId, watchlist);
  return watchlist;
}

/**
 * Get watchlist with current prices
 */
export async function getWatchlistWithPrices(
  userId: string
): Promise<{ watchlist: Watchlist; prices: Record<string, number> }> {
  const watchlist = await getWatchlist(userId);
  
  if (watchlist.items.length === 0) {
    return { watchlist, prices: {} };
  }
  
  // Fetch current prices from CoinGecko
  const coinIds = watchlist.items.map(i => i.coinId).join(',');
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (response.ok) {
      const priceData = await response.json();
      const prices: Record<string, number> = {};
      
      for (const coinId of Object.keys(priceData)) {
        prices[coinId] = priceData[coinId].usd;
      }
      
      return { watchlist, prices };
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  }
  
  return { watchlist, prices: {} };
}

// =============================================================================
// Helper Functions
// =============================================================================

async function saveWatchlist(userId: string, watchlist: Watchlist): Promise<void> {
  const key = getWatchlistKey(userId);
  
  try {
    await kv.set(key, watchlist);
    
    // Update index of all users with watchlists
    const indexKey = getWatchlistIndexKey();
    const index = await kv.get<string[]>(indexKey) || [];
    if (!index.includes(userId)) {
      index.push(userId);
      await kv.set(indexKey, index);
    }
  } catch (error) {
    console.warn('KV not available, using in-memory storage:', error);
    inMemoryWatchlists.set(userId, watchlist);
  }
}

/**
 * Get default user ID from session/cookie
 * In production, this would come from authentication.
 * 
 * Falls back to 'default-user' for:
 * - Anonymous users without cookies
 * - Development/testing environments
 * - Users without API keys
 * 
 * The API route layer handles API key-based user identification before
 * this fallback is reached (see /api/watchlist/route.ts).
 */
export function getDefaultUserId(): string {
  // Default user for anonymous access - data will be shared across all anonymous users
  return 'default-user';
}
