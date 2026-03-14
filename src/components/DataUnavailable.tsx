'use client';

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
  title = 'Data temporarily unavailable',
  message = "We couldn't load this page right now. Please try again in a few moments.",
  showHomeLink = true,
}: DataUnavailableProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 text-5xl">⚠️</span>
      <h2 className="text-text-primary mb-3 font-serif text-2xl font-bold">{title}</h2>
      <p className="text-text-secondary mb-6 max-w-md">{message}</p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-accent hover:bg-accent-hover cursor-pointer rounded-md px-5 py-2 text-sm font-medium text-white transition-colors"
        >
          Refresh page
        </button>
        {showHomeLink && (
          <Link
            href="/"
            className="border-border hover:bg-surface-secondary rounded-md border px-5 py-2 text-sm font-medium transition-colors"
          >
            Go home
          </Link>
        )}
      </div>
    </div>
  );
}
