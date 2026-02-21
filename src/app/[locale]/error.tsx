'use client';

/**
 * Locale-level Error Boundary
 * Catches unhandled errors in any route under /[locale]/*
 * Routes with their own error.tsx (e.g. /coin/[coinId]) will use theirs instead.
 */

import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ERROR_SUGGESTIONS: Record<string, { title: string; href: string; back: string }> = {
  '/article': { title: 'Browse latest news', href: '/', back: 'Back to news' },
  '/blog': { title: 'View all posts', href: '/blog', back: 'Back to blog' },
  '/markets': { title: 'Visit markets overview', href: '/markets', back: 'Back to markets' },
  '/coin': { title: 'Browse all coins', href: '/coin', back: 'Back to coins' },
  '/defi': { title: 'View DeFi overview', href: '/defi', back: 'Back to DeFi' },
  '/search': { title: 'Search news', href: '/search', back: 'New search' },
  '/portfolio': { title: 'Your portfolio', href: '/portfolio', back: 'Back to portfolio' },
  '/watchlist': { title: 'Your watchlist', href: '/watchlist', back: 'Back to watchlist' },
  '/signals': { title: 'View all signals', href: '/signals', back: 'Back to signals' },
  '/whales': { title: 'Whale tracker', href: '/whales', back: 'Back to whales' },
};

function getCtaForPath(path: string) {
  for (const prefix of Object.keys(ERROR_SUGGESTIONS)) {
    if (path.includes(prefix)) return ERROR_SUGGESTIONS[prefix];
  }
  return { title: 'Return to homepage', href: '/', back: 'Go home' };
}

export default function LocaleError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to monitoring/Sentry if configured
    console.error('[LocaleError boundary]', error);
  }, [error]);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const cta = getCtaForPath(currentPath);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-2xl p-8 text-center backdrop-blur-sm">
          {/* Warning icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-400 text-sm mb-1 leading-relaxed">
            An unexpected error occurred. This is likely temporary — try
            refreshing or come back in a moment.
          </p>

          {error.message && process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2 mt-3 mb-2 font-mono text-left break-all">
              {error.message}
            </p>
          )}

          {error.digest && (
            <p className="text-xs text-gray-600 mt-2 mb-5 font-mono">
              ref: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <button
              onClick={reset}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl transition-colors"
            >
              Try again
            </button>
            <Link
              href={cta.href}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm rounded-xl transition-colors border border-gray-700"
            >
              {cta.back}
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
          <span>·</span>
          <Link href="/search" className="hover:text-gray-300 transition-colors">
            Search
          </Link>
          <span>·</span>
          <Link href="/status" className="hover:text-gray-300 transition-colors">
            Status page
          </Link>
          <span>·</span>
          <a
            href="https://github.com/nirholas/free-crypto-news/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Report issue
          </a>
        </div>
      </div>
    </div>
  );
}
