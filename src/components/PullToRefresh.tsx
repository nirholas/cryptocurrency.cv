'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;
  const MAX_PULL = 150;

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance as user pulls further
        const resistance = 1 - diff / (MAX_PULL * 3);
        const distance = Math.min(diff * resistance, MAX_PULL);
        setPullDistance(distance);
        
        // Prevent default scroll
        if (diff > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(60); // Keep spinner visible during refresh
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  const spinnerOpacity = Math.min(pullDistance / THRESHOLD, 1);
  const spinnerScale = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = pullDistance * 2;

  return (
    <div 
      ref={containerRef} 
      className={`pull-to-refresh-container relative overflow-auto ${className}`}
    >
      {/* Pull indicator */}
      <div 
        className="pull-to-refresh-indicator absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{
          top: `${Math.max(pullDistance - 50, -50)}px`,
          opacity: spinnerOpacity,
          transform: `translateX(-50%) scale(${spinnerScale})`,
          transition: isPulling.current ? 'none' : 'all 0.3s ease',
        }}
      >
        <div 
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center"
        >
          <svg
            className={`w-6 h-6 text-orange-500 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isRefreshing ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Content with transform */}
      <div 
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
