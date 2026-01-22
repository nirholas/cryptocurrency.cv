'use client';

/**
 * Category Tabs Component
 * Horizontal scrollable category filter tabs
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌐' },
  { id: 'defi', name: 'DeFi', icon: '🏦' },
  { id: 'nft', name: 'NFT', icon: '🖼️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'layer-1', name: 'Layer 1', icon: '⛓️' },
  { id: 'layer-2', name: 'Layer 2', icon: '📦' },
  { id: 'meme', name: 'Memes', icon: '🐕' },
  { id: 'ai', name: 'AI', icon: '🤖' },
  { id: 'exchange', name: 'Exchange', icon: '💱' },
  { id: 'stablecoin', name: 'Stablecoins', icon: '💵' },
  { id: 'privacy', name: 'Privacy', icon: '🔒' },
  { id: 'storage', name: 'Storage', icon: '💾' },
];

interface CategoryTabsProps {
  activeCategory?: string;
}

export default function CategoryTabs({ activeCategory = 'all' }: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      container?.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (categoryId === 'all') {
        params.delete('category');
      } else {
        params.set('category', categoryId);
      }
      
      // Reset to page 1 when changing category
      params.delete('page');
      
      const queryString = params.toString();
      router.push(`/markets${queryString ? `?${queryString}` : ''}`);
    },
    [router, searchParams]
  );

  return (
    <div className="relative mb-4">
      {/* Left scroll button */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          );
        })}
        
        {/* View all categories link */}
        <a
          href="/markets/categories"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          <span>➕</span>
          <span>More</span>
        </a>
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
