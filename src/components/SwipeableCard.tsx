'use client';

import { useState, useRef, ReactNode } from 'react';
import { useHapticFeedback } from '@/hooks/useMobile';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
  className?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
  className = '',
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const haptic = useHapticFeedback();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow swipe if there's an action in that direction
    if (diff > 0 && !onSwipeRight) return;
    if (diff < 0 && !onSwipeLeft) return;
    
    // Apply resistance at edges
    const resistance = 0.6;
    const resistedOffset = diff * resistance;
    setOffsetX(resistedOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(offsetX) >= threshold) {
      haptic('medium');
      
      if (offsetX > 0 && onSwipeRight) {
        // Animate out to the right
        setOffsetX(300);
        setTimeout(() => {
          onSwipeRight();
          setOffsetX(0);
        }, 200);
      } else if (offsetX < 0 && onSwipeLeft) {
        // Animate out to the left
        setOffsetX(-300);
        setTimeout(() => {
          onSwipeLeft();
          setOffsetX(0);
        }, 200);
      }
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const showLeftAction = offsetX > 30 && leftAction;
  const showRightAction = offsetX < -30 && rightAction;

  return (
    <div className={`swipeable relative overflow-hidden ${className}`}>
      {/* Left action (revealed on swipe right) */}
      {leftAction && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start px-4 bg-green-600 dark:bg-green-700"
          style={{ 
            opacity: showLeftAction ? 1 : 0,
            width: Math.abs(offsetX),
            transition: isDragging ? 'none' : 'opacity 0.2s ease'
          }}
        >
          {leftAction}
        </div>
      )}

      {/* Right action (revealed on swipe left) */}
      {rightAction && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-600 dark:bg-red-700"
          style={{ 
            opacity: showRightAction ? 1 : 0,
            width: Math.abs(offsetX),
            transition: isDragging ? 'none' : 'opacity 0.2s ease'
          }}
        >
          {rightAction}
        </div>
      )}

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        className="relative z-10 bg-white dark:bg-slate-800"
      >
        {children}
      </div>
    </div>
  );
}
