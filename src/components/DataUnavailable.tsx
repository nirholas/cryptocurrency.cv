"use client";

import { Link } from "@/i18n/navigation";

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
  title = "Data temporarily unavailable",
  message = "We couldn't load this page right now. Please try again in a few moments.",
  showHomeLink = true,
}: DataUnavailableProps) {
  return (
    <div className="py-20 text-center min-h-[40vh] flex flex-col items-center justify-center">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-2xl font-bold font-serif mb-3 text-text-primary">
        {title}
      </h2>
      <p className="text-text-secondary mb-6 max-w-md">{message}</p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Refresh page
        </button>
        {showHomeLink && (
          <Link
            href="/"
            className="px-5 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-secondary transition-colors"
          >
            Go home
          </Link>
        )}
      </div>
    </div>
  );
}
