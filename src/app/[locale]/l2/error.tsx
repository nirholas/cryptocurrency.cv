/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function L2Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      scope="l2"
      title="Layer 2 data unavailable"
      description="Rollup TVL, throughput and fee data did not load. Try again in a moment, or check mainnet gas prices while this recovers."
      fallback={{ href: '/gas', label: 'Check gas prices' }}
    />
  );
}
