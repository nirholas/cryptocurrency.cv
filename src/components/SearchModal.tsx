'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  source?: string;
  date?: string;
  url: string;
}

const RECENT_SEARCHES_KEY = 'crypto-news-recent-searches';
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_MS = 300;

const popularSearches = [
  { query: 'Bitcoin ETF', icon: '₿' },
  { query: 'Ethereum merge', icon: 'Ξ' },
  { query: 'DeFi protocols', icon: '🏦' },
  { query: 'NFT marketplace', icon: '🎨' },
  { query: 'Crypto regulation', icon: '⚖️' },
];

const quickActions = [
  { label: 'Trending News', href: '/trending', icon: '🔥', description: 'See what\'s hot' },
  { label: 'Market Data', href: '/markets', icon: '📈', description: 'Live prices & charts' },
  { label: 'DeFi Dashboard', href: '/defi', icon: '🏦', description: 'TVL & yields' },
  { label: 'News Sources', href: '/sources', icon: '📚', description: 'Browse by source' },
];

// Mock function to simulate live search - in production, replace with actual API call
async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!query.trim()) return [];
  
  // Mock results based on query
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: `${query} - Latest developments and analysis`,
      category: 'bitcoin',
      categoryIcon: '₿',
      source: 'CoinDesk',
      date: '2 hours ago',
      url: `/search?q=${encodeURIComponent(query)}`,
    },
    {
      id: '2',
      title: `Breaking: ${query} sees major institutional interest`,
      category: 'markets',
      categoryIcon: '📈',
      source: 'Bloomberg',
      date: '4 hours ago',
      url: `/search?q=${encodeURIComponent(query)}`,
    },
    {
      id: '3',
      title: `How ${query} is reshaping the crypto landscape`,
      category: 'analysis',
      categoryIcon: '📊',
      source: 'CryptoSlate',
      date: '1 day ago',
      url: `/search?q=${encodeURIComponent(query)}`,
    },
  ];
  
  return mockResults;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'actions'>('all');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          setRecentSearches([]);
        }
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(-1);
      setActiveTab('all');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetchSearchResults(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Calculate total navigable items
  const totalItems = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults.length;
    }
    return recentSearches.length + popularSearches.length + quickActions.length;
  }, [searchQuery, searchResults, recentSearches.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === -1 && searchQuery.trim()) {
          handleSearch();
        } else if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          router.push(searchResults[selectedIndex].url);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        // Cycle through tabs
        setActiveTab(prev => {
          if (prev === 'all') return 'articles';
          if (prev === 'articles') return 'actions';
          return 'all';
        });
        break;
    }
  }, [totalItems, selectedIndex, searchQuery, searchResults, router, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current || selectedIndex < 0) return;
    const selectedItem = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, onClose]);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const newSearches = [
      { query: trimmed, timestamp: Date.now() },
      ...recentSearches.filter(s => s.query.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleQuickSearch = (query: string) => {
    saveRecentSearch(query);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    router.push(result.url);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSearches = recentSearches.filter(s => s.query !== query);
    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  };

  if (!isOpen) return null;

  const showResults = searchQuery.trim().length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] md:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop with animated gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50 animate-fade-in-up"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Search Header */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
          <div className="flex items-center border-b border-gray-200 dark:border-slate-700">
            <div className="pl-5 text-gray-400">
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search articles, topics, coins..."
              className="w-full px-4 py-5 text-lg bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
              autoComplete="off"
              aria-label="Search query"
            />
            <div className="flex items-center gap-2 pr-4">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                ESC
              </kbd>
            </div>
          </div>
        </form>

        {/* Tabs */}
        {showResults && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
            {(['all', 'articles', 'actions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Search Content */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
          {/* Live Search Results */}
          {showResults && (
            <div className="p-2">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      data-index={index}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
                        selectedIndex === index
                          ? 'bg-brand-50 dark:bg-brand-900/30 ring-2 ring-brand-500/20'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        selectedIndex === index ? 'bg-brand-100 dark:bg-brand-800/50' : 'bg-gray-100 dark:bg-slate-700'
                      }`}>
                        {result.categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-1">
                          {result.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                          {result.source && <span>{result.source}</span>}
                          {result.source && result.date && <span>•</span>}
                          {result.date && <span>{result.date}</span>}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 mt-1 transition-transform ${
                        selectedIndex === index ? 'text-brand-500 translate-x-0' : 'text-gray-300 dark:text-slate-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="py-8 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500 dark:text-slate-400">No results for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Try different keywords</p>
                </div>
              ) : null}
              
              {/* Search action */}
              <button
                onClick={handleSearch}
                className="w-full flex items-center gap-3 p-3 mt-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-dashed border-gray-200 dark:border-slate-700"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-brand-600 dark:text-brand-400">
                    Search for "{searchQuery}"
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    Press Enter to see all results
                  </div>
                </div>
                <kbd className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 rounded">↵</kbd>
              </button>
            </div>
          )}

          {/* Default Content (when not searching) */}
          {!showResults && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search.query}
                        onClick={() => handleQuickSearch(search.query)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {search.query}
                        <span
                          onClick={(e) => removeRecentSearch(search.query, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 dark:hover:bg-slate-600 rounded transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Trending Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((item) => (
                    <button
                      key={item.query}
                      onClick={() => handleQuickSearch(item.query)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-800/50 hover:from-brand-50 hover:to-brand-100/50 dark:hover:from-brand-900/30 dark:hover:to-brand-800/20 rounded-full transition-all hover:scale-105 border border-gray-200/50 dark:border-slate-700/50"
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {action.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {action.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800/80 dark:to-slate-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 font-medium shadow-sm">↑↓</kbd>
                navigate
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 font-medium shadow-sm">↵</kbd>
                select
              </span>
              <span className="hidden md:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 font-medium shadow-sm">Tab</kbd>
                switch tabs
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 font-medium shadow-sm">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600 font-medium shadow-sm">K</kbd>
              <span className="hidden sm:inline">to open</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
