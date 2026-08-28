/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function DefiError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="defi"
      title="DeFi data unavailable"
      description="Protocol TVL and yield data did not load. The DeFi data provider may be temporarily degraded. Try again, or read the latest DeFi coverage instead."
      fallback={{ href: '/defi-news', label: 'Read DeFi news' }}
    />
  );
}
