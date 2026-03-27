/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WatchlistCoin {
  id: string;
  name: string;
  symbol: string;
  addedAt: string;
  /** Optional user note for this coin */
  note?: string;
  /** Optional tags for grouping */
  tags?: string[];
}

export interface WatchlistExportData {
  version: 2;
  exportedAt: string;
  coins: WatchlistCoin[];
}

export type SortPreference =
  | "custom"
  | "name-asc"
  | "name-desc"
  | "added-newest"
  | "added-oldest";

interface WatchlistContextType {
  /** All watchlisted coins */
  coins: WatchlistCoin[];
  /** Add a coin (returns true if added, false if duplicate/full) */
  addCoin: (coin: Pick<WatchlistCoin, "id" | "name" | "symbol">) => boolean;
  /** Remove a coin by id */
  removeCoin: (id: string) => void;
  /** Check if a coin is watched */
  isCoinWatched: (id: string) => boolean;
  /** Reorder coins (for drag/move) */
  reorderCoins: (newOrder: WatchlistCoin[]) => void;
  /** Update a coin's note */
  updateNote: (id: string, note: string) => void;
  /** Add a tag to a coin */
  addTag: (id: string, tag: string) => void;
  /** Remove a tag from a coin */
  removeTag: (id: string, tag: string) => void;
  /** Clear all coins */
  clearAll: () => void;
  /** Export watchlist as JSON string */
  exportJSON: () => string;
  /** Export watchlist as CSV string */
  exportCSV: () => string;
  /** Import watchlist from JSON string. Returns {imported, skipped, error?} */
  importJSON: (data: string) => { imported: number; skipped: number; error?: string };
  /** All unique tags across coins */
  allTags: string[];
  /** Current sort preference */
  sortPreference: SortPreference;
  /** Update sort preference */
  setSortPreference: (pref: SortPreference) => void;
  /** Max coins allowed */
  maxCoins: number;
  /** Whether the provider has hydrated from localStorage */
  hydrated: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "fcn-watchlist";
const SORT_KEY = "fcn-watchlist-sort";
const MAX_COINS = 50;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WatchlistContext = createContext<WatchlistContextType>({
  coins: [],
  addCoin: () => false,
  removeCoin: () => {},
  isCoinWatched: () => false,
  reorderCoins: () => {},
  updateNote: () => {},
  addTag: () => {},
  removeTag: () => {},
  clearAll: () => {},
  exportJSON: () => "{}",
  exportCSV: () => "",
  importJSON: () => ({ imported: 0, skipped: 0 }),
  allTags: [],
  sortPreference: "custom",
  setSortPreference: () => {},
  maxCoins: MAX_COINS,
  hydrated: false,
});

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): WatchlistCoin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as WatchlistCoin[];
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(coins: WatchlistCoin[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coins));
  } catch {
    /* quota exceeded – silently ignore */
  }
}

function loadSortPreference(): SortPreference {
  if (typeof window === "undefined") return "custom";
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (raw && ["custom", "name-asc", "name-desc", "added-newest", "added-oldest"].includes(raw)) {
      return raw as SortPreference;
    }
    return "custom";
  } catch {
    return "custom";
  }
}

function saveSortPreference(pref: SortPreference): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SORT_KEY, pref);
  } catch {
    /* silently ignore */
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<WatchlistCoin[]>([]);
  const [sortPreference, setSortPrefState] = useState<SortPreference>("custom");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setCoins(loadFromStorage());
    setSortPrefState(loadSortPreference());
    setHydrated(true);
  }, []);

  // Sync across browser tabs
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setCoins(loadFromStorage());
      }
      if (e.key === SORT_KEY) {
        setSortPrefState(loadSortPreference());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // -- Coin CRUD --

  const addCoin = useCallback(
    (coin: Pick<WatchlistCoin, "id" | "name" | "symbol">): boolean => {
      let added = false;
      setCoins((prev) => {
        if (prev.some((c) => c.id === coin.id)) return prev;
        if (prev.length >= MAX_COINS) return prev;
        const next = [
          ...prev,
          {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            addedAt: new Date().toISOString(),
            tags: [],
          },
        ];
        saveToStorage(next);
        added = true;
        return next;
      });
      return added;
    },
    [],
  );

  const removeCoin = useCallback((id: string) => {
    setCoins((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const isCoinWatched = useCallback(
    (id: string) => coins.some((c) => c.id === id),
    [coins],
  );

  const reorderCoins = useCallback((newOrder: WatchlistCoin[]) => {
    setCoins(newOrder);
    saveToStorage(newOrder);
  }, []);

  // -- Notes --

  const updateNote = useCallback((id: string, note: string) => {
    setCoins((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, note: note.trim() || undefined } : c));
      saveToStorage(next);
      return next;
    });
  }, []);

  // -- Tags --

  const addTag = useCallback((id: string, tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    setCoins((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const tags = c.tags ?? [];
        if (tags.includes(normalized)) return c;
        return { ...c, tags: [...tags, normalized] };
      });
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeTag = useCallback((id: string, tag: string) => {
    setCoins((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, tags: (c.tags ?? []).filter((t) => t !== tag) };
      });
      saveToStorage(next);
      return next;
    });
  }, []);

  // -- Bulk operations --

  const clearAll = useCallback(() => {
    setCoins([]);
    saveToStorage([]);
  }, []);

  // -- Export / Import --

  const exportJSON = useCallback((): string => {
    const data: WatchlistExportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      coins,
    };
    return JSON.stringify(data, null, 2);
  }, [coins]);

  const exportCSV = useCallback((): string => {
    const header = "Coin ID,Name,Symbol,Added At,Tags,Note";
    const rows = coins.map((c) =>
      [
        c.id,
        `"${c.name}"`,
        c.symbol,
        c.addedAt,
        `"${(c.tags ?? []).join(";")}"`,
        `"${(c.note ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    return [header, ...rows].join("\n");
  }, [coins]);

  const importJSON = useCallback(
    (data: string): { imported: number; skipped: number; error?: string } => {
      try {
        const parsed = JSON.parse(data);

        let incoming: WatchlistCoin[] = [];

        // Support v2 format
        if (parsed.version === 2 && Array.isArray(parsed.coins)) {
          incoming = parsed.coins;
        }
        // Support v1 format (just coin IDs)
        else if (parsed.version === 1 && Array.isArray(parsed.coins)) {
          incoming = parsed.coins.map((id: string) => ({
            id,
            name: id,
            symbol: id.toUpperCase().slice(0, 5),
            addedAt: new Date().toISOString(),
          }));
        }
        // Support raw array
        else if (Array.isArray(parsed)) {
          incoming = parsed;
        } else {
          return { imported: 0, skipped: 0, error: "Unrecognized format" };
        }

        let imported = 0;
        let skipped = 0;

        setCoins((prev) => {
          const existing = new Set(prev.map((c) => c.id));
          const toAdd: WatchlistCoin[] = [];

          for (const coin of incoming) {
            if (!coin.id) { skipped++; continue; }
            if (existing.has(coin.id)) { skipped++; continue; }
            if (prev.length + toAdd.length >= MAX_COINS) { skipped++; continue; }
            toAdd.push({
              id: coin.id,
              name: coin.name || coin.id,
              symbol: coin.symbol || coin.id.toUpperCase().slice(0, 5),
              addedAt: coin.addedAt || new Date().toISOString(),
              note: coin.note,
              tags: coin.tags,
            });
            imported++;
          }

          const next = [...prev, ...toAdd];
          saveToStorage(next);
          return next;
        });

        return { imported, skipped };
      } catch {
        return { imported: 0, skipped: 0, error: "Invalid JSON" };
      }
    },
    [],
  );

  // -- Sort preference --

  const setSortPreference = useCallback((pref: SortPreference) => {
    setSortPrefState(pref);
    saveSortPreference(pref);
  }, []);

  // -- Derived data --

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const c of coins) {
      for (const t of c.tags ?? []) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [coins]);

  return (
    <WatchlistContext
      value={{
        coins,
        addCoin,
        removeCoin,
        isCoinWatched,
        reorderCoins,
        updateNote,
        addTag,
        removeTag,
        clearAll,
        exportJSON,
        exportCSV,
        importJSON,
        allTags,
        sortPreference,
        setSortPreference,
        maxCoins: MAX_COINS,
        hydrated,
      }}
    >
      {children}
    </WatchlistContext>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWatchlist() {
  return useContext(WatchlistContext);
}
