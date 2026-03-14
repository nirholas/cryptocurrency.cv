/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * AuthorCard — Displays an author card in the authors directory grid.
 */

import { Link } from '@/i18n/navigation';
import type { Author } from '@/lib/authors';

function getInitialColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-emerald-500 to-emerald-700',
    'from-orange-500 to-orange-700',
    'from-rose-500 to-rose-700',
    'from-cyan-500 to-cyan-700',
    'from-amber-500 to-amber-700',
    'from-indigo-500 to-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function AuthorCard({ author }: { author: Author }) {
  const initials = author.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sourcesLabel =
    author.sources.length > 2
      ? `${author.sources[0]}, ${author.sources[1]} +${author.sources.length - 2}`
      : author.sources.join(', ');

  return (
    <Link
      href={`/author/${author.slug}`}
      className="group block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:shadow-md hover:border-[var(--color-accent)]/40"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getInitialColor(author.name)} text-sm font-bold text-white`}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate">
            {author.name}
          </h3>
          <p className="text-xs text-[var(--color-text-tertiary)] truncate">
            {sourcesLabel}
          </p>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {author.articleCount} {author.articleCount === 1 ? 'article' : 'articles'}
      </p>
    </Link>
  );
}
