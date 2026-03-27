/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Tag } from '@/lib/tags';

export function TagChip({ tag, size = 'default' }: { tag: Tag; size?: 'sm' | 'default' }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      )}
    >
      {tag.icon && <span>{tag.icon}</span>}
      {tag.name}
    </Link>
  );
}

export default TagChip;
