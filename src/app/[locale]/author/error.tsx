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

export default function AuthorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[author-error]', error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="container-main flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-4 font-serif text-4xl font-bold">Author page unavailable</h1>
        <p className="text-text-secondary mb-4 max-w-md">
          We couldn&apos;t load the author profile right now. Please try again or browse other
          sections.
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
            href="/authors"
            className="border-border hover:bg-surface-secondary rounded-md border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Browse authors
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
