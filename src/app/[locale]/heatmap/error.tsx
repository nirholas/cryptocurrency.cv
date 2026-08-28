/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function HeatmapError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="heatmap"
      title="Heatmap data unavailable"
      description="We could not build the market heatmap because the price snapshot it maps did not arrive. Try again in a moment, or read the same numbers in the markets table."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
