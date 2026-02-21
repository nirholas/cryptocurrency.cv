/**
 * MessageSearch Component
 * 
 * Searchable conversation history with highlighting
 */

'use client';

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ChatMessage } from './types';
import { sanitizeHighlight } from '@/lib/sanitize-dom';

// Debounce hook for search performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface MessageSearchProps {
  messages: ChatMessage[];
  onResultClick?: (messageId: string) => void;
  onClose?: () => void;
}

interface SearchResult {
  message: ChatMessage;
  matchCount: number;
  preview: string;
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>');
}

function MessageSearchComponent({ messages, onResultClick, onClose }: MessageSearchProps) {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 150);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search results using debounced query
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];
    
    const lowerQuery = debouncedQuery.toLowerCase();
    
    return messages
      .filter((msg) => msg.content.toLowerCase().includes(lowerQuery))
      .map((message) => {
        const content = message.content;
        const lowerContent = content.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        
        // Create preview with context around match
        const previewStart = Math.max(0, index - 40);
        const previewEnd = Math.min(content.length, index + debouncedQuery.length + 60);
        let preview = content.slice(previewStart, previewEnd);
        
        if (previewStart > 0) preview = '...' + preview;
        if (previewEnd < content.length) preview = preview + '...';
        
        // Count matches
        const matchCount = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
        
        return { message, matchCount, preview };
      })
      .sort((a, b) => b.matchCount - a.matchCount);
  }, [messages, debouncedQuery]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onResultClick?.(results[selectedIndex].message.id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    },
    [results, selectedIndex, onResultClick, onClose]
  );

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, results.length]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
      {/* Search header */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="w-full pl-9 pr-16 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg
                       text-sm text-gray-100 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            aria-label="Search messages"
            aria-describedby="search-results-count"
          />
          
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-500 
                         hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 
                         hover:text-gray-300 transition-colors"
              aria-label="Close search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Results count */}
        <div 
          id="search-results-count"
          className="mt-2 text-xs text-gray-500"
        >
          {query.length >= 2 ? (
            results.length > 0 ? (
              <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
            ) : (
              <span>No results found</span>
            )
          ) : query.length > 0 ? (
            <span>Type at least 2 characters</span>
          ) : (
            <span>Search through your conversation history</span>
          )}
        </div>
      </div>

      {/* Results list */}
      <div 
        ref={resultsRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        role="listbox"
        aria-label="Search results"
      >
        {results.length > 0 ? (
          results.map((result, index) => (
            <button
              key={result.message.id}
              onClick={() => onResultClick?.(result.message.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${
                index === selectedIndex
                  ? 'bg-blue-600/30 border-blue-500/50'
                  : 'bg-gray-800/30 hover:bg-gray-800/50 border-transparent'
              } border`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${
                  result.message.role === 'user' ? 'text-blue-400' : 'text-purple-400'
                }`}>
                  {result.message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(result.message.timestamp)}
                </span>
                {result.matchCount > 1 && (
                  <span className="ml-auto text-xs text-gray-500">
                    {result.matchCount} matches
                  </span>
                )}
              </div>
              
              <div 
                className="text-sm text-gray-300 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: sanitizeHighlight(highlightText(result.preview, query)) }}
              />
            </button>
          ))
        ) : query.length >= 2 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <svg
              className="w-12 h-12 mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">No messages match your search</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <svg
              className="w-12 h-12 mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">Start typing to search</p>
            <p className="text-xs mt-1">Use ↑↓ to navigate, Enter to select</p>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="p-2 border-t border-gray-700/50 text-xs text-gray-500 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">↑</kbd>
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">↓</kbd>
          <span>Navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd>
          <span>Select</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Esc</kbd>
          <span>{t('close')}</span>
        </span>
      </div>
    </div>
  );
}

export const MessageSearch = memo(MessageSearchComponent);
export default MessageSearch;
