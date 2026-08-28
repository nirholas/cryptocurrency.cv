/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function StablecoinsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="stablecoins"
      title="Stablecoin data unavailable"
      description="Supply, peg and chain distribution data did not load. Try again in a moment, or browse the wider market while this recovers."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
