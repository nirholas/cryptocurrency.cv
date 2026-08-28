/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function UnlocksError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="unlocks"
      title="Unlock schedule unavailable"
      description="The token unlock calendar did not load. Vesting schedules come from an upstream tracker that may be temporarily down. Try again, or check the affected coins directly."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
