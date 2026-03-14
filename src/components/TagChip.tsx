import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Tag } from '@/lib/tags';

export function TagChip({ tag, size = 'default' }: { tag: Tag; size?: 'sm' | 'default' }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-secondary)] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      )}
    >
      {tag.icon && <span>{tag.icon}</span>}
      {tag.name}
    </Link>
  );
}

export default TagChip;
