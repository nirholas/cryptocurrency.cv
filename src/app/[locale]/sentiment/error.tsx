/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function SentimentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="sentiment"
      title="Sentiment data unavailable"
      description="We could not score the current news and social flow. Try again in a moment, or read the Fear & Greed index for a single headline number."
      fallback={{ href: '/fear-greed', label: 'See Fear & Greed' }}
    />
  );
}
