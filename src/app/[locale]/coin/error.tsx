'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CoinError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[coin-error]', error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="container-main flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-4 font-serif text-4xl font-bold">Coin data unavailable</h1>
        <p className="text-text-secondary mb-4 max-w-md">
          We couldn&apos;t load the coin data right now. The market data provider may be temporarily
          unavailable — please try again shortly.
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
            href="/markets"
            className="border-border hover:bg-surface-secondary rounded-md border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Browse markets
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
