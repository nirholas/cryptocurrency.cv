/**
 * ViewTracker Component
 * Tracks article views on page load
 */

'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  articleId: string;
  articleTitle?: string;
}

/**
 * Invisible component that tracks article views
 * 
 * @example
 * <ViewTracker articleId={article.id} articleTitle={article.title} />
 */
export function ViewTracker({ articleId, articleTitle }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (tracked.current) return;
    tracked.current = true;

    const trackView = async () => {
      try {
        await fetch('/api/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId,
            articleTitle,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        // Silently fail - view tracking is non-critical
        console.debug('View tracking failed:', error);
      }
    };

    // Delay tracking slightly to avoid counting bounces
    const timer = setTimeout(trackView, 2000);
    
    return () => clearTimeout(timer);
  }, [articleId, articleTitle]);

  // This component renders nothing
  return null;
}

export default ViewTracker;
