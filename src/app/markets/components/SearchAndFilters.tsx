'use client';

/**
 * Search and Filters Component
 * Search with autocomplete + dropdown filters
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { TokenPrice } from '@/lib/market-data';

interface SearchAndFiltersProps {
  coins: TokenPrice[];
}

// Filter options
const PRICE_RANGES = [
  { id: 'all', label: 'All Prices' },
  { id: '0-1', label: '$0 - $1' },
  { id: '1-10', label: '$1 - $10' },
  { id: '10-100', label: '$10 - $100' },
  { id: '100+', label: '$100+' },
];

const MARKET_CAP_RANGES = [
  { id: 'all', label: 'All Market Caps' },
  { id: '1b+', label: '> $1B' },
  { id: '100m+', label: '> $100M' },
  { id: '10m+', label: '> $10M' },
  { id: '<10m', label: '< $10M' },
];

const VOLUME_RANGES = [
  { id: 'all', label: 'All Volumes' },
  { id: '1b+', label: '> $1B' },
  { id: '100m+', label: '> $100M' },
  { id: '10m+', label: '> $10M' },
];

const CHANGE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gainers', label: 'Gainers Only' },
  { id: 'losers', label: 'Losers Only' },
];

const ROWS_PER_PAGE_OPTIONS = [20, 50, 100];

interface DropdownProps {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function FilterDropdown({ label, options, value, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
      >
        <span className="text-gray-500 dark:text-gray-400">{label}:</span>
        <span className="text-gray-900 dark:text-white">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[160px]">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                option.id === value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchAndFilters({ coins }: SearchAndFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentCoinSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter coins for autocomplete
  const filteredCoins = searchQuery
    ? coins
        .filter(
          (coin) =>
            coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const updateUrlParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset page on filter change
      if (key !== 'page') {
        params.delete('page');
      }
      const queryString = params.toString();
      router.push(`/markets${queryString ? `?${queryString}` : ''}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      
      // Debounce URL update
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        updateUrlParams('search', value);
      }, 300);
    },
    [updateUrlParams]
  );

  const handleSelectCoin = (coinId: string, coinName: string) => {
    // Save to recent searches
    const newRecent = [coinName, ...recentSearches.filter((s) => s !== coinName)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentCoinSearches', JSON.stringify(newRecent));
    
    // Navigate to coin page
    router.push(`/coin/${coinId}`);
    setShowAutocomplete(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    updateUrlParams('search', '');
    setShowAutocomplete(false);
  };

  return (
    <div className="mb-4 space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div ref={searchRef} className="relative flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowAutocomplete(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (searchQuery || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30 overflow-hidden">
              {/* Search Results */}
              {filteredCoins.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    Search Results
                  </div>
                  {filteredCoins.map((coin) => (
                    <button
                      key={coin.id}
                      onClick={() => handleSelectCoin(coin.id, coin.name)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative w-6 h-6">
                        {coin.image && (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{coin.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {coin.symbol.toUpperCase()}
                      </span>
                      {coin.market_cap_rank && (
                        <span className="ml-auto text-gray-400 text-xs">#{coin.market_cap_rank}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('recentCoinSearches');
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchQuery && filteredCoins.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                  No coins found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Dropdowns */}
        <FilterDropdown
          label="Price"
          options={PRICE_RANGES}
          value={searchParams.get('price') || 'all'}
          onChange={(v) => updateUrlParams('price', v)}
        />
        <FilterDropdown
          label="Market Cap"
          options={MARKET_CAP_RANGES}
          value={searchParams.get('marketCap') || 'all'}
          onChange={(v) => updateUrlParams('marketCap', v)}
        />
        <FilterDropdown
          label="24h Change"
          options={CHANGE_FILTERS}
          value={searchParams.get('change') || 'all'}
          onChange={(v) => updateUrlParams('change', v)}
        />

        {/* Rows per page */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
          <select
            value={searchParams.get('perPage') || '50'}
            onChange={(e) => updateUrlParams('perPage', e.target.value)}
            className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROWS_PER_PAGE_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num} rows
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
