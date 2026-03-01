/**
 * LazySection - Intersection Observer wrapper for below-fold sections
 * 
 * Defers rendering of heavy components until they enter the viewport,
 * improving initial page load (LCP) and reducing JavaScript execution (INP).
 */
'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** Fallback shown before the section enters the viewport */
  fallback?: ReactNode;
  /** How far before the element to start loading (default: '200px') */
  rootMargin?: string;
  /** CSS class applied to the wrapper */
  className?: string;
  /** Minimum height for the placeholder to prevent layout shift */
  minHeight?: string;
}

const defaultFallback = (
  <div
    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 animate-pulse"
    style={{ minHeight: '12rem' }}
    aria-hidden="true"
  />
);

export function LazySection({
  children,
  fallback = defaultFallback,
  rootMargin = '200px',
  className,
  minHeight,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IntersectionObserver is not available, render immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={minHeight ? { minHeight } : undefined}>
      {isVisible ? children : fallback}
    </div>
  );
}
