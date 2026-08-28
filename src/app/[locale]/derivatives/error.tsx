/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function DerivativesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="derivatives"
      title="Derivatives data unavailable"
      description="Open interest, funding rates and liquidations did not load. The derivatives exchanges we poll may be throttling us. Try again, or check spot markets in the meantime."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
