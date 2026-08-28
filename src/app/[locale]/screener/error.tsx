/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function ScreenerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="screener"
      title="Screener data unavailable"
      description="The coin list behind the screener did not load. This is almost always a temporary upstream hiccup. Try again, or browse the markets table instead."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
