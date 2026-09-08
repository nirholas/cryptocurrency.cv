/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Per-method hues.
 *
 * Chips are painted with `color-mix` against the live surface and text tokens
 * rather than `dark:` variants, because this site ships three themes (light,
 * dark, midnight) and Tailwind's `dark:` variant only matches one of them. The
 * mix keeps the fill pale-on-light and deep-on-dark automatically, and keeps
 * the label at a readable contrast on both.
 */
export const METHOD_HUE: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
  HEAD: '#64748b',
  OPTIONS: '#64748b',
};

/** Hue for a method, falling back to the neutral slate used by HEAD/OPTIONS. */
export function methodHue(method: string): string {
  return METHOD_HUE[method.toUpperCase()] ?? '#64748b';
}

/** Background/foreground pair for a hue, resolved against the current theme. */
export function hueStyle(hue: string, strength: 'soft' | 'solid' = 'soft') {
  if (strength === 'solid') {
    return {
      backgroundColor: hue,
      color: 'color-mix(in srgb, #000 78%, #fff)',
      borderColor: hue,
    };
  }
  return {
    backgroundColor: `color-mix(in srgb, ${hue} 15%, var(--color-surface))`,
    color: `color-mix(in srgb, ${hue} 74%, var(--color-text-primary))`,
    borderColor: `color-mix(in srgb, ${hue} 32%, transparent)`,
  };
}

export interface MethodChipProps {
  method: string;
  className?: string;
  /** `sm` is the sidebar size; `md` sits next to the endpoint path heading. */
  size?: 'sm' | 'md';
}

/** Color-coded HTTP method chip. */
export function MethodChip({ method, className, size = 'sm' }: MethodChipProps) {
  const upper = method.toUpperCase();
  return (
    <Badge
      className={cn(
        'shrink-0 border font-mono tracking-tight',
        size === 'sm' ? 'px-1.5 py-0 text-[10px] leading-[18px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
      style={hueStyle(methodHue(upper))}
    >
      {upper}
    </Badge>
  );
}
