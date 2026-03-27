/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const QUICK_LINKS = [
  { href: '/', label: 'Latest News' },
  { href: '/markets', label: 'Markets' },
  { href: '/bitcoin', label: 'Bitcoin' },
  { href: '/ethereum', label: 'Ethereum' },
  { href: '/defi', label: 'DeFi' },
];

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[page-error]', error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="container-main flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-4 font-serif text-4xl font-bold">Something went wrong</h1>
        <p className="text-text-secondary mb-4 max-w-md">
          We had trouble loading this page. The data may be temporarily unavailable — try again or
          browse another section below.
        </p>
        {error?.digest && (
          <p className="text-text-tertiary mb-6 text-xs">Error ID: {error.digest}</p>
        )}
        <div className="mb-10 flex gap-4">
          <button
            onClick={reset}
            className="bg-accent hover:bg-accent-hover cursor-pointer rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-border hover:bg-surface-secondary rounded-md border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Go home
          </Link>
        </div>
        <nav aria-label="Quick links" className="flex flex-wrap justify-center gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-full border px-4 py-2 text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
      <Footer />
    </>
  );
}
