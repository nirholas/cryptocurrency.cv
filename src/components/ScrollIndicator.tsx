'use client';

/**
 * Horizontal Scroll Indicator Component
 * Adds fade edges and optional arrow buttons to horizontally scrollable containers
 */

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ScrollIndicatorProps {
  children: ReactNode;
  className?: string;
  showArrows?: boolean;
  arrowSize?: 'sm' | 'md' | 'lg';
}

export function ScrollIndicator({ 
  children, 
  className = '',
  showArrows = true,
  arrowSize = 'md'
}: ScrollIndicatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Use ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const arrowSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Left fade gradient */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 dark:from-slate-950 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Right fade gradient */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 dark:from-slate-950 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Left arrow button */}
      {showArrows && (
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 ${arrowSizeClasses[arrowSize]} rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-150 ${
            canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <svg className={iconSizeClasses[arrowSize]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow button */}
      {showArrows && (
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 ${arrowSizeClasses[arrowSize]} rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-150 ${
            canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <svg className={iconSizeClasses[arrowSize]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * ScrollSnapItem - Wrapper for items inside ScrollIndicator for snap behavior
 */
export function ScrollSnapItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`scroll-snap-align-start ${className}`} style={{ scrollSnapAlign: 'start' }}>
      {children}
    </div>
  );
}
