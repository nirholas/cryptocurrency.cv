/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function PortfolioError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="portfolio"
      title="Portfolio unavailable"
      description="We could not price your holdings because the market data feed did not respond. Your holdings are stored safely and nothing was lost. Try again in a moment."
      fallback={{ href: '/watchlist', label: 'Open your watchlist' }}
    />
  );
}
