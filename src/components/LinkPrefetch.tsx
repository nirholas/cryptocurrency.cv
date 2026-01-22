'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';

interface PrefetchLinkProps extends Omit<LinkProps, 'onMouseEnter' | 'onFocus'> {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before prefetching starts (default: 100ms) */
  prefetchDelay?: number;
  /** Whether to show loading indicator on click */
  showLoadingOnClick?: boolean;
  /** Additional props to pass to the anchor element */
  [key: string]: unknown;
}

/**
 * Enhanced Link component that prefetches on hover/focus with configurable delay
 * Provides visual feedback and optimizes navigation performance
 */
export function PrefetchLink({ 
  children, 
  className = '',
  prefetchDelay = 100,
  showLoadingOnClick = false,
  href,
  ...props 
}: PrefetchLinkProps) {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start prefetch after delay
    timeoutRef.current = setTimeout(() => {
      setIsPrefetching(true);
      // Next.js router.prefetch for programmatic prefetching
      if (typeof href === 'string') {
        router.prefetch(href);
      }
    }, prefetchDelay);
  }, [href, prefetchDelay, router]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPrefetching(false);
  }, []);

  const handleClick = useCallback(() => {
    if (showLoadingOnClick) {
      setIsNavigating(true);
    }
  }, [showLoadingOnClick]);

  return (
    <Link
      href={href}
      className={`${className} ${isNavigating ? 'opacity-70 pointer-events-none' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
      {isPrefetching && (
        <span className="sr-only">Loading...</span>
      )}
    </Link>
  );
}

/**
 * Navigation link with prefetch and active state styling
 */
interface NavLinkProps extends PrefetchLinkProps {
  /** Current active path for highlighting */
  activePath?: string;
  /** Class to apply when link is active */
  activeClassName?: string;
  /** Class to apply when link is inactive */
  inactiveClassName?: string;
}

export function NavLink({
  children,
  href,
  activePath,
  activeClassName = 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30',
  inactiveClassName = 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800',
  className = '',
  ...props
}: NavLinkProps) {
  const hrefString = typeof href === 'string' ? href : href.pathname || '';
  const isActive = activePath === hrefString || 
                   (hrefString !== '/' && activePath?.startsWith(hrefString));

  return (
    <PrefetchLink
      href={href}
      className={`${className} ${isActive ? activeClassName : inactiveClassName}`}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </PrefetchLink>
  );
}

/**
 * Card link wrapper with prefetch and hover effects
 */
interface CardLinkProps extends PrefetchLinkProps {
  /** Whether this is an external link */
  external?: boolean;
}

export function CardLink({
  children,
  external = false,
  className = '',
  href,
  ...props
}: CardLinkProps) {
  if (external) {
    return (
      <a
        href={typeof href === 'string' ? href : href.pathname || ''}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <PrefetchLink
      href={href}
      className={`group block transition-transform duration-200 hover:-translate-y-1 ${className}`}
      prefetchDelay={150}
      {...props}
    >
      {children}
    </PrefetchLink>
  );
}

export default PrefetchLink;
