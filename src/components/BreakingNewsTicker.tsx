'use client';

import React, { useState, useEffect, useRef } from 'react';

interface BreakingNewsItem {
  id: string;
  title: string;
  link: string;
  source?: string;
  timeAgo?: string;
}

interface BreakingNewsTickerProps {
  items: BreakingNewsItem[];
  /** Auto-rotate interval in ms (default: 5000) */
  rotateInterval?: number;
  /** Pause rotation on hover */
  pauseOnHover?: boolean;
}

export function BreakingNewsTicker({ 
  items, 
  rotateInterval = 5000,
  pauseOnHover = true 
}: BreakingNewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate through items
  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsAnimating(false);
      }, 300);
    }, rotateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [items.length, rotateInterval, isPaused]);

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsAnimating(false);
    }, 150);
  };

  if (!items.length) return null;

  const currentItem = items[currentIndex];

  return (
    <div 
      className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white relative overflow-hidden"
      role="region"
      aria-label="Breaking news"
      aria-live="polite"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
        style={{ animationDuration: '3s' }}
        aria-hidden="true"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-2.5 relative">
        <div className="flex items-center gap-3">
          {/* Breaking badge with pulse */}
          <div className="relative flex-shrink-0">
            <span 
              className="absolute inset-0 bg-white rounded-md animate-ping opacity-20" 
              aria-hidden="true" 
            />
            <span className="relative flex items-center gap-1.5 bg-white text-red-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-lg">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" aria-hidden="true" />
              Breaking
            </span>
          </div>
          
          {/* News content with slide animation */}
          <div className="flex-1 overflow-hidden">
            <div 
              className={`transition-all duration-300 ${
                isAnimating 
                  ? 'opacity-0 transform -translate-y-2' 
                  : 'opacity-100 transform translate-y-0'
              }`}
            >
              <a
                href={currentItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-white/90 line-clamp-1 focus:outline-none focus:underline transition-colors"
                aria-label={`${currentItem.title} (opens in new tab)`}
              >
                {currentItem.title}
              </a>
            </div>
          </div>

          {/* Meta info */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {currentItem.source && (
              <span className="text-red-100 text-xs">
                {currentItem.source}
              </span>
            )}
            {currentItem.timeAgo && (
              <span className="text-red-200 text-xs flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {currentItem.timeAgo}
              </span>
            )}
          </div>

          {/* Navigation controls */}
          {items.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Previous news"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Progress dots */}
              <div className="flex items-center gap-1 px-1" role="tablist">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentIndex(index);
                        setIsAnimating(false);
                      }, 150);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-white w-4' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    role="tab"
                    aria-selected={index === currentIndex}
                    aria-label={`News item ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Next news"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* External link icon */}
          <a
            href={currentItem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors hidden md:flex"
            aria-label="Open in new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
          <div 
            className="h-full bg-white/60 animate-progress"
            style={{ 
              animationDuration: `${rotateInterval}ms`,
              animationIterationCount: 'infinite'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress linear infinite;
        }
      `}</style>
    </div>
  );
}

export default BreakingNewsTicker;
