/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function ArbitrageError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="arbitrage"
      title="Arbitrage data unavailable"
      description="We compare live order books across exchanges to find spreads, and at least one of those feeds did not respond. Try again, or review the exchanges we track."
      fallback={{ href: '/exchanges', label: 'Compare exchanges' }}
    />
  );
}
