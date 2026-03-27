/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Link } from '@/i18n/navigation';
import { ChevronRight, Home } from 'lucide-react';

import { NonceScript } from './NonceScript';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation — provides hierarchical context on sub-pages.
 * Renders JSON-LD structured data for SEO.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://cryptocurrency.cv${item.href}` } : {}),
    })),
  };

  return (
    <>
      <NonceScript
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav aria-label="Breadcrumb" className="container-main border-border border-b py-3">
        <ol className="text-text-tertiary flex items-center gap-1.5 overflow-x-auto text-sm">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={index} className="flex shrink-0 items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="text-border h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isLast ? (
                  <span
                    className="text-text-primary max-w-[200px] truncate font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-text-primary flex items-center gap-1 transition-colors"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
