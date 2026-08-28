/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function MarketsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="markets"
      title="Market data unavailable"
      description="We could not load live prices and market caps. The upstream market data provider may be rate limiting us right now. Try again, or open the screener for the same coins with different filters."
      fallback={{ href: '/screener', label: 'Open the screener' }}
    />
  );
}
