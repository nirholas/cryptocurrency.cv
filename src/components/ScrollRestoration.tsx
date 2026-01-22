'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface ScrollRestorationProps {
  /** Scroll to top on route change */
  scrollToTop?: boolean;
  /** Smooth scroll behavior */
  smooth?: boolean;
  /** Delay before scrolling (ms) */
  delay?: number;
  /** Exclude paths from scroll restoration (regex patterns) */
  excludePaths?: RegExp[];
}

/**
 * Handles scroll restoration on route changes
 * Next.js App Router doesn't handle this automatically in all cases
 */
export function ScrollRestoration({
  scrollToTop = true,
  smooth = false,
  delay = 0,
  excludePaths = [],
}: ScrollRestorationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!scrollToTop) return;

    // Check if path should be excluded
    const isExcluded = excludePaths.some(pattern => pattern.test(pathname));
    if (isExcluded) return;

    const scrollAction = () => {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    };

    if (delay > 0) {
      const timer = setTimeout(scrollAction, delay);
      return () => clearTimeout(timer);
    } else {
      scrollAction();
    }
  }, [pathname, searchParams, scrollToTop, smooth, delay, excludePaths]);

  return null;
}

/**
 * Hook to manage focus after navigation
 * Useful for accessibility - focuses main content after route change
 */
export function useFocusOnRouteChange(targetId = 'main-content') {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        // Set tabindex if not already focusable
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, targetId]);
}

/**
 * Announce route changes to screen readers
 */
export function RouteAnnouncer() {
  const pathname = usePathname();

  useEffect(() => {
    // Get page title or create one from pathname
    const pageTitle = document.title || pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page';
    
    // Create or update announcer element
    let announcer = document.getElementById('route-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Announce the new page
    announcer.textContent = `Navigated to ${pageTitle}`;

    return () => {
      // Clear announcement after a short delay
      setTimeout(() => {
        if (announcer) announcer.textContent = '';
      }, 1000);
    };
  }, [pathname]);

  return null;
}

/**
 * Combined component for all navigation accessibility features
 */
export function NavigationAccessibility({
  scrollToTop = true,
  smoothScroll = false,
  focusMainContent = true,
  announceRoutes = true,
}: {
  scrollToTop?: boolean;
  smoothScroll?: boolean;
  focusMainContent?: boolean;
  announceRoutes?: boolean;
}) {
  useFocusOnRouteChange(focusMainContent ? 'main-content' : '');

  return (
    <>
      {scrollToTop && <ScrollRestoration scrollToTop smooth={smoothScroll} />}
      {announceRoutes && <RouteAnnouncer />}
    </>
  );
}

export default ScrollRestoration;
