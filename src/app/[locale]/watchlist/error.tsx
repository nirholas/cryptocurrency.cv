/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function WatchlistError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="watchlist"
      title="Watchlist unavailable"
      description="We could not load prices for the coins you follow. Your watchlist itself is intact. Try again, or open your portfolio instead."
      fallback={{ href: '/portfolio', label: 'Open your portfolio' }}
    />
  );
}
