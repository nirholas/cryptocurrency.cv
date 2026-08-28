/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function GasError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      scope="gas"
      title="Gas prices unavailable"
      description="Live gas estimates did not load. The node providers we query may be rate limiting us. Try again, or compare layer 2 networks where fees are far lower anyway."
      fallback={{ href: '/l2', label: 'Compare L2 networks' }}
    />
  );
}
