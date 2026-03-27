/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { NEWSLETTERS } from '@/lib/newsletters';
import NewsletterSubscribeForm from '@/components/NewsletterSubscribeForm';

export default function NewsletterSubscribeAll() {
  const allIds = NEWSLETTERS.map((n) => n.id);

  return (
    <div className="mx-auto max-w-md">
      <NewsletterSubscribeForm newsletterIds={allIds} />
      <p className="text-text-tertiary mt-2 text-center text-[11px]">
        Subscribe to all 5 newsletters at once. Free forever. Unsubscribe anytime.
      </p>
    </div>
  );
}
