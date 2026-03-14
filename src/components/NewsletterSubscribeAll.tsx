'use client';

import { NEWSLETTERS } from '@/lib/newsletters';
import NewsletterSubscribeForm from '@/components/NewsletterSubscribeForm';

export default function NewsletterSubscribeAll() {
  const allIds = NEWSLETTERS.map((n) => n.id);

  return (
    <div className="mx-auto max-w-md">
      <NewsletterSubscribeForm newsletterIds={allIds} />
      <p className="mt-2 text-center text-[11px] text-[var(--color-text-tertiary)]">
        Subscribe to all 5 newsletters at once. Free forever. Unsubscribe anytime.
      </p>
    </div>
  );
}
