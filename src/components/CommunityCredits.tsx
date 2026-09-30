/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CONTRIBUTORS, avatarFor, kindLabel, linkFor } from '@/data/contributors';

/**
 * Everyone credited in src/data/contributors.json: people who wrote code,
 * reported bugs and security issues, or helped other users. Each card lists
 * what they did, linked to the commit or issue.
 */
export function CommunityCredits() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CONTRIBUTORS.map((person) => (
        <li
          key={person.login}
          className="border-border hover:border-accent/40 flex flex-col rounded-xl border bg-(--color-surface) p-5 transition-colors"
        >
          <a
            href={linkFor(person)}
            target="_blank"
            rel="noopener noreferrer"
            className="group focus-visible:ring-accent mb-3 flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          >
            <img
              src={avatarFor(person)}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-full"
            />
            <span className="min-w-0">
              <span className="text-text-primary group-hover:text-accent block truncate font-semibold transition-colors">
                {person.name ?? person.login}
              </span>
              <span className="text-text-tertiary block truncate text-xs">
                {person.githubProfile === false
                  ? 'account no longer on GitHub'
                  : `@${person.login}`}
              </span>
            </span>
          </a>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {person.kinds.map((kind) => (
              <Badge key={kind}>{kindLabel(kind)}</Badge>
            ))}
          </div>
          <ul className="text-text-secondary space-y-1.5 text-sm">
            {person.contributions.map((c) => (
              <li key={c.url + c.summary}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent inline-flex gap-1 transition-colors hover:underline"
                >
                  <span>{c.summary}</span>
                  <ExternalLink aria-hidden className="mt-0.5 h-3 w-3 shrink-0 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
