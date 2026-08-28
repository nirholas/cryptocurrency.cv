/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function FearGreedError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="fear-greed"
      title="Fear & Greed index unavailable"
      description="The index reading did not load. It is published once a day by an upstream source that occasionally goes quiet. Try again, or read the broader sentiment breakdown."
      fallback={{ href: '/sentiment', label: 'See market sentiment' }}
    />
  );
}
