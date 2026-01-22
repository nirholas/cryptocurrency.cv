'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BackToTopProps {
  /** Scroll threshold in pixels before showing button */
  threshold?: number;
  /** Smooth scroll duration */
  smooth?: boolean;
  /** Position from bottom */
  bottomOffset?: string;
  /** Position from right */
  rightOffset?: string;
}

export function BackToTop({ 
  threshold = 400,
  smooth = true,
  bottomOffset = '6rem',
  rightOffset = '1.5rem',
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      setIsVisible(scrollTop > threshold);
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [smooth]);

  // Keyboard shortcut: Home key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Home' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          scrollToTop();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scrollToTop]);

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed z-40 p-3 rounded-full shadow-lg
        bg-white dark:bg-slate-800 
        border border-gray-200 dark:border-slate-700
        text-gray-600 dark:text-slate-300
        hover:bg-gray-50 dark:hover:bg-slate-700
        hover:text-brand-600 dark:hover:text-brand-400
        hover:shadow-xl hover:scale-110
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
      `}
      style={{ bottom: bottomOffset, right: rightOffset }}
      aria-label="Scroll to top"
      title={`Scroll to top (${Math.round(scrollProgress)}% scrolled)`}
    >
      {/* Progress ring */}
      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
        {/* Background circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 10}`}
          strokeDashoffset={`${2 * Math.PI * 10 * (1 - scrollProgress / 100)}`}
          className="text-brand-500 transition-all duration-150"
        />
        {/* Arrow icon */}
        <g transform="rotate(90 12 12)">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-current"
          />
        </g>
      </svg>
    </button>
  );
}

export default BackToTop;
