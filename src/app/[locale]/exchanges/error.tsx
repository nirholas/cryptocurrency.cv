/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function ExchangesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="exchanges"
      title="Exchange data unavailable"
      description="Exchange volumes and trust scores did not load. Try again in a moment, or look at the coins themselves in the markets table."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
