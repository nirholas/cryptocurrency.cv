/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function AlertsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="alerts"
      title="Alerts unavailable"
      description="We could not load your alert rules. Any alert you already created is still stored and still evaluating. Try again in a moment."
      fallback={{ href: '/watchlist', label: 'Open your watchlist' }}
    />
  );
}
