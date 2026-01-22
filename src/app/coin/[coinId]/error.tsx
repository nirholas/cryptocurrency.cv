/**
 * Error boundary for coin detail page
 */

'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CoinPageError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Coin page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-400 mb-6">
          We couldn&apos;t load the coin data. This might be a temporary issue with our
          data provider.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
          
          <Link
            href="/markets"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
          >
            Back to Markets
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            If this problem persists, please{' '}
            <a
              href="https://github.com/nirholas/free-crypto-news/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400"
            >
              report an issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
