/**
 * Category Navigation
 * Navigation bar for different news categories with improved styling and dark mode support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface CategoryNavProps {
  activeCategory?: string;
}

const categories = [
  { slug: '', label: 'All News', icon: '📰', color: 'bg-gray-100 dark:bg-slate-800' },
  { slug: 'bitcoin', label: 'Bitcoin', icon: '₿', color: 'bg-orange-100 dark:bg-orange-900/30' },
  { slug: 'ethereum', label: 'Ethereum', icon: 'Ξ', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { slug: 'defi', label: 'DeFi', icon: '🏦', color: 'bg-green-100 dark:bg-green-900/30' },
  { slug: 'nft', label: 'NFTs', icon: '🎨', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { slug: 'regulation', label: 'Regulation', icon: '⚖️', color: 'bg-red-100 dark:bg-red-900/30' },
  { slug: 'markets', label: 'Markets', icon: '📈', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { slug: 'analysis', label: 'Analysis', icon: '📊', color: 'bg-cyan-100 dark:bg-cyan-900/30' },
];

export default function CategoryNav({ activeCategory = '' }: CategoryNavProps) {
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    handleScroll(); // Initial check
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Scroll to active category on mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeElement = container.querySelector('[aria-current="page"]');
    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      const scrollLeft = elementRect.left - containerRect.left - (containerRect.width / 2) + (elementRect.width / 2);
      container.scrollBy({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  return (
    <nav 
      className="border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-[64px] z-30"
      aria-label="News categories"
    >
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Left fade indicator */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
            showLeftFade ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
        
        {/* Right fade indicator */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
            showRightFade ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide"
          role="tablist"
          aria-label="Filter by category"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const href = cat.slug ? `/category/${cat.slug}` : '/';
            
            return (
              <Link
                key={cat.slug}
                href={href}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap 
                  transition-all duration-200 focus-ring
                  ${isActive 
                    ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-lg shadow-brand-500/25 scale-[1.02]' 
                    : `${cat.color} text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:shadow-md active:scale-95`
                  }
                `}
              >
                <span 
                  className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
                  aria-hidden="true"
                >
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
                {isActive && (
                  <span className="sr-only">(current)</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
