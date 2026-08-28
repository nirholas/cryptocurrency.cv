/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function WhalesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="whales"
      title="Whale activity unavailable"
      description="We could not load recent large on-chain transfers. The chain indexer we read may be catching up. Try again shortly, or watch prices for the same move."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
