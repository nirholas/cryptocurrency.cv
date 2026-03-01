/**
 * Homepage Error State
 * 
 * Shown when the news feed fails to load, replacing silent empty renders
 * with a user-facing message and retry affordance.
 */
'use client';

import { useRouter } from 'next/navigation';

export function HomepageError() {
  const router = useRouter();

  return (
    <div
      className="mx-4 sm:mx-6 lg:mx-8 mb-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center"
      role="alert"
    >
      <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
      <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
        Unable to load news
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
        We&apos;re having trouble connecting to our news sources. This is usually temporary.
      </p>
      <button
        onClick={() => router.refresh()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try again
      </button>
    </div>
  );
}
