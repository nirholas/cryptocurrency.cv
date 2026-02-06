/**
 * @fileoverview Reading Progress Bar Component
 * 
 * Displays a visual indicator of scroll progress on article pages.
 * Uses a throttled scroll listener for performance and a gradient
 * background for visual appeal.
 * 
 * @module components/ReadingProgress
 * 
 * @example
 * // In an article page
 * import ReadingProgress from '@/components/ReadingProgress';
 * 
 * export default function ArticlePage() {
 *   return (
 *     <>
 *       <ReadingProgress />
 *       <article>...</article>
 *     </>
 *   );
 * }
 * 
 * @features
 * - Throttled scroll listener (requestAnimationFrame)
 * - Gradient progress bar (brand-500 to amber-500)
 * - Fixed position at top of viewport
 * - Accessible with ARIA progressbar role
 * - Responsive to window resize
 * - Dark mode compatible
 */
'use client';

import { useEffect, useState } from 'react';

interface ReadingProgressProps {
  className?: string;
}

export default function ReadingProgress({ className = '' }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(scrollProgress, 100));
    };

    // Initial calculation
    updateProgress();

    // Update on scroll with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 h-1 z-50 bg-gray-200/50 dark:bg-gray-700/50 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-gradient-to-r from-gray-600 to-gray-400 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
