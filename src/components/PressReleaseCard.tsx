/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Link } from '@/i18n/navigation';
import type { PressReleaseSubmission } from '@/lib/press-release';

interface Props {
  release: PressReleaseSubmission;
}

export function PressReleaseCard({ release }: Props) {
  const excerpt =
    release.body.length > 300 ? release.body.slice(0, 300).trimEnd() + '…' : release.body;

  return (
    <article className="mb-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 uppercase">
          Press Release
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {release.category}
        </span>
        {release.tier === 'featured' && (
          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            Featured
          </span>
        )}
      </div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {release.title}
      </h2>
      <div className="mb-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{release.projectName}</span>
        <span>·</span>
        <time dateTime={release.createdAt}>{new Date(release.createdAt).toLocaleDateString()}</time>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{excerpt}</p>
      {release.projectUrl && (
        <a
          href={release.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {release.projectName} →
        </a>
      )}
    </article>
  );
}
