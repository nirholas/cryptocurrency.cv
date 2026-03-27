/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface DataUnavailableProps {
  /** Heading text shown to the user */
  title?: string;
  /** Descriptive message below the heading */
  message?: string;
  /** Whether to show a "Go home" link (default true) */
  showHomeLink?: boolean;
}

/**
 * Fallback UI shown when a page's primary data source is unavailable.
 * Prevents blank pages by giving users a clear message and a way out.
 */
export default function DataUnavailable({
  title,
  message,
  showHomeLink = true,
}: DataUnavailableProps) {
  const t = useTranslations('dataUnavailable');
  const displayTitle = title ?? t('defaultTitle');
  const displayMessage = message ?? t('defaultMessage');
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 text-5xl">⚠️</span>
      <h2 className="text-text-primary mb-3 font-serif text-2xl font-bold">{displayTitle}</h2>
      <p className="text-text-secondary mb-6 max-w-md">{displayMessage}</p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-accent hover:bg-accent-hover cursor-pointer rounded-md px-5 py-2 text-sm font-medium text-white transition-colors"
        >
          {t('refresh')}
        </button>
        {showHomeLink && (
          <Link
            href="/"
            className="border-border hover:bg-surface-secondary rounded-md border px-5 py-2 text-sm font-medium transition-colors"
          >
            {t('goHome')}
          </Link>
        )}
      </div>
    </div>
  );
}
