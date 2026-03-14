import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wider uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
        bitcoin: 'cat-bitcoin',
        ethereum: 'cat-ethereum',
        defi: 'cat-defi',
        nft: 'cat-nft',
        regulation: 'cat-regulation',
        altcoins: 'cat-altcoins',
        trading: 'cat-trading',
        mining: 'cat-mining',
        web3: 'cat-web3',
        live: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
        breaking: 'bg-red-600 text-white',
        opinion: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map a category slug to a badge variant */
export function categoryToBadgeVariant(
  category: string,
): VariantProps<typeof badgeVariants>['variant'] {
  const map: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    bitcoin: 'bitcoin',
    ethereum: 'ethereum',
    defi: 'defi',
    nft: 'nft',
    regulation: 'regulation',
    altcoins: 'altcoins',
    trading: 'trading',
    mining: 'mining',
    web3: 'web3',
  };
  return map[category.toLowerCase()] ?? 'default';
}
