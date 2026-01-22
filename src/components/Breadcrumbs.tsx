'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /** Override automatic breadcrumb generation with custom items */
  items?: BreadcrumbItem[];
  /** Custom labels for path segments (e.g., { 'category': 'Categories' }) */
  customLabels?: Record<string, string>;
  /** Show home icon instead of "Home" text */
  showHomeIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Default label mappings for common routes
const defaultLabels: Record<string, string> = {
  category: 'Category',
  topic: 'Topic',
  source: 'Source',
  article: 'Article',
  markets: 'Markets',
  movers: 'Top Movers',
  trending: 'Trending',
  defi: 'DeFi',
  sources: 'Sources',
  topics: 'Topics',
  search: 'Search',
  bookmarks: 'Bookmarks',
  sentiment: 'Sentiment',
  digest: 'Digest',
  about: 'About',
  examples: 'Examples',
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  altcoins: 'Altcoins',
  nft: 'NFTs',
  regulation: 'Regulation',
  analysis: 'Analysis',
};

// Convert slug to title case
function toTitleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Generate breadcrumbs from pathname
function generateBreadcrumbs(
  pathname: string,
  customLabels: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const decodedSegment = decodeURIComponent(segment);
    const label = customLabels[decodedSegment] || 
                  defaultLabels[decodedSegment] || 
                  toTitleCase(decodedSegment);
    
    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

export function Breadcrumbs({ 
  items, 
  customLabels = {}, 
  showHomeIcon = true,
  className = '' 
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  const breadcrumbs = items || generateBreadcrumbs(pathname, customLabels);
  
  // Don't render if only home breadcrumb
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`py-3 px-4 lg:px-6 max-w-7xl mx-auto ${className}`}
    >
      <ol 
        className="flex items-center flex-wrap gap-1 text-sm"
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <li 
              key={item.href}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {/* Separator */}
              {!isFirst && (
                <svg 
                  className="w-4 h-4 mx-1 text-gray-300 dark:text-slate-600 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {isLast ? (
                // Current page - no link
                <span 
                  className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                // Link to previous pages
                <Link
                  href={item.href}
                  className="group flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  itemProp="item"
                >
                  {/* Home icon */}
                  {isFirst && showHomeIcon ? (
                    <svg 
                      className="w-4 h-4 group-hover:scale-110 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ) : null}
                  <span itemProp="name" className={isFirst && showHomeIcon ? 'sr-only sm:not-sr-only' : ''}>
                    {item.label}
                  </span>
                </Link>
              )}
              
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact variant for mobile/narrow spaces
export function BreadcrumbsCompact({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  
  if (pathname === '/') return null;
  
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  // Get parent path
  const parentPath = segments.length > 1 
    ? '/' + segments.slice(0, -1).join('/')
    : '/';
  
  const parentLabel = segments.length > 1
    ? defaultLabels[segments[segments.length - 2]] || toTitleCase(segments[segments.length - 2])
    : 'Home';

  return (
    <nav aria-label="Breadcrumb" className={`py-2 px-4 ${className}`}>
      <Link
        href={parentPath}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to {parentLabel}</span>
      </Link>
    </nav>
  );
}

export default Breadcrumbs;
