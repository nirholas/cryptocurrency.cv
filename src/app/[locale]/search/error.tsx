/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import SegmentError from '@/components/SegmentError';

export default function SearchError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="search"
      title="Search is unavailable"
      description="The search index did not respond to that query. Try again, or browse the latest articles from the homepage."
      fallback={{ href: '/', label: 'Back to the latest news' }}
    />
  );
}
