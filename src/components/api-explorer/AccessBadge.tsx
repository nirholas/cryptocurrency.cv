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
import { hueStyle } from './MethodChip';
import type { AccessTier } from './types';

const FREE_HUE = '#14b8a6';
const METERED_HUE = '#f59e0b';

export interface AccessBadgeProps {
  access: AccessTier;
  /** Decimal USD price, shown on metered endpoints when the spec quotes one. */
  price?: string;
  className?: string;
}

/**
 * Free vs metered pill.
 *
 * The tier comes from the OpenAPI document, which derives it from the same
 * middleware patterns that answer 402 at runtime, so the badge cannot drift
 * from what the endpoint actually does.
 */
export function AccessBadge({ access, price, className }: AccessBadgeProps) {
  const metered = access === 'metered';
  return (
    <Badge
      className={cn('border font-mono tracking-tight', className)}
      style={hueStyle(metered ? METERED_HUE : FREE_HUE)}
      title={
        metered
          ? 'Metered: pay per request with x402, or send an API key'
          : 'Free: no key and no payment required'
      }
    >
      {metered ? (price ? `$${price}` : 'metered') : 'free'}
    </Badge>
  );
}
