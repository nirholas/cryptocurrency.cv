'use client';

/**
 * Category Tabs Component
 * Horizontal scrollable category filter tabs
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '' },
  { id: 'defi', name: 'DeFi', icon: '🏦' },
  { id: 'layer-1', name: 'Layer 1', icon: '⛓️' },
  { id: 'layer-2', name: 'Layer 2', icon: '📦' },
  { id: 'ai', name: 'AI', icon: '🤖' },
  { id: 'nft', name: 'NFT', icon: '🖼️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'meme', name: 'Memes', icon: '🐕' },
  { id: 'exchange', name: 'Exchange', icon: '💱' },
  { id: 'stablecoin', name: 'Stablecoins', icon: '💵' },
  { id: 'privacy', name: 'Privacy', icon: '🔒' },
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
    <div className="relative mb-3">
      {/* Left fade + arrow */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="w-8 h-full bg-gradient-to-r from-black to-transparent pointer-events-none absolute" />
          <button
            onClick={() => scroll('left')}
            className="relative z-10 w-7 h-7 bg-black border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div ref={scrollRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-0.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-black border border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat.icon && <span className="text-xs">{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 mx-1 shrink-0" />

        {/* View all categories */}
        <a
          href="/markets/categories"
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm bg-black border border-white/10 text-white/40 hover:border-white/30 hover:text-white transition-all whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Categories</span>
        </a>
      </div>

      {/* Right fade + arrow */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="w-8 h-full bg-gradient-to-l from-black to-transparent pointer-events-none absolute" />
          <button
            onClick={() => scroll('right')}
            className="relative z-10 w-7 h-7 bg-black border border-white/10 rounded-full shadow flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
