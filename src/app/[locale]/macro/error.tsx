/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function MacroError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="macro"
      title="Macro data unavailable"
      description="Rates, inflation and equity correlation data did not load. The macro data provider may be rate limiting us. Try again, or look at crypto markets on their own."
      fallback={{ href: '/markets', label: 'Browse markets' }}
    />
  );
}
