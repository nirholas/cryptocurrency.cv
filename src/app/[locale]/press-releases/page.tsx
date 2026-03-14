'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { PressReleaseCard } from '@/components/PressReleaseCard';
import { PRESS_RELEASE_CATEGORIES } from '@/lib/press-release';
import type { PressReleaseSubmission } from '@/lib/press-release';

const PAGE_SIZE = 10;

export default function PressReleasesPage() {
  const [releases, setReleases] = useState<PressReleaseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/press-release');
        if (res.ok) {
          const data = await res.json();
          setReleases(data.pressReleases ?? []);
        }
      } catch {
        // silently fail — empty list shown
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    category === 'All' ? releases : releases.filter((r) => r.category === category);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Press Releases</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Press releases are submitted by third parties and do not represent editorial content.
          </p>
        </div>
        <Link
          href="/submit-press-release"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Submit a Press Release
        </Link>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['All', ...PRESS_RELEASE_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              category === cat
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading…</div>
      ) : paginated.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
            No press releases yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Be the first to{' '}
            <Link
              href="/submit-press-release"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              submit a press release
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((release) => (
              <PressReleaseCard key={release.id} release={release} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-3 py-1 text-sm disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-3 py-1 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
