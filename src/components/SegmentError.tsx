/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Shared body for the route-segment `error.tsx` boundaries. Every data-heavy
 * section renders this with its own heading, explanation, and a fallback
 * destination that still works when that section's upstream is down.
 */

'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export interface SegmentErrorProps {
  /** The error Next.js caught while rendering the segment. */
  error: Error & { digest?: string };
  /** Re-renders the segment from scratch. */
  reset: () => void;
  /** Namespaces the console entry, e.g. `markets` logs as `[markets-error]`. */
  scope: string;
  /** Short heading naming what is unavailable. */
  title: string;
  /** One or two sentences: what failed, and what the reader can do next. */
  description: string;
  /** Secondary destination offered beside "Try again". Defaults to the homepage. */
  fallback?: { href: string; label: string };
}

export default function SegmentError({
  error,
  reset,
  scope,
  title,
  description,
  fallback = { href: '/', label: 'Go home' },
}: SegmentErrorProps) {
  useEffect(() => {
    console.error(`[${scope}-error]`, error);
  }, [error, scope]);

  return (
    <>
      <Header />
      <main
        role="alert"
        className="container-main flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"
      >
        <h1 className="mb-4 font-serif text-4xl font-bold">{title}</h1>
        <p className="text-text-secondary mb-4 max-w-md">{description}</p>
        {error?.digest && (
          <p className="text-text-tertiary mb-6 text-xs">Error ID: {error.digest}</p>
        )}
        <div className="mb-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-accent hover:bg-accent-hover focus-visible:ring-accent cursor-pointer rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Try again
          </button>
          <Link
            href={fallback.href}
            className="border-border hover:bg-surface-secondary focus-visible:ring-accent rounded-md border px-6 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {fallback.label}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
