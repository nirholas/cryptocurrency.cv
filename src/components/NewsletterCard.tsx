/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { Newspaper, TrendingUp, Layers, Code, GraduationCap, Mail as MailIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import NewsletterSubscribeForm from '@/components/NewsletterSubscribeForm';
import type { Newsletter } from '@/lib/newsletters';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Newspaper,
  TrendingUp,
  Layers,
  Code,
  GraduationCap,
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
};

const CATEGORY_LABELS: Record<string, string> = {
  news: 'News',
  markets: 'Markets',
  defi: 'DeFi',
  education: 'Education',
  developer: 'Developer',
};

export default function NewsletterCard({ newsletter }: { newsletter: Newsletter }) {
  const Icon = ICON_MAP[newsletter.icon] || MailIcon;

  return (
    <Card className="group hover:border-accent/50 h-full transition-colors">
      <CardContent className="flex h-full flex-col p-6">
        {/* Icon + Name */}
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-surface-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
            <Icon className="text-accent h-5 w-5" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/newsletters/${newsletter.slug}`}
              className="text-text-primary hover:text-accent font-bold transition-colors"
            >
              {newsletter.name}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{FREQUENCY_LABELS[newsletter.frequency]}</Badge>
              <span className="text-text-tertiary text-[11px]">
                {CATEGORY_LABELS[newsletter.category]}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-text-secondary mb-4 flex-1 text-sm leading-relaxed">
          {newsletter.description}
        </p>

        {/* Sample Subject  */}
        <div className="bg-surface-secondary mb-4 rounded-lg p-3 text-xs">
          <span className="text-text-tertiary mb-0.5 block">Sample subject:</span>
          <span className="text-text-primary font-medium">{newsletter.sampleSubject}</span>
        </div>

        {/* Subscribe Form */}
        <NewsletterSubscribeForm newsletterIds={[newsletter.id]} compact />

        {/* Preview link */}
        {newsletter.previewUrl && (
          <a
            href={newsletter.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent mt-3 text-xs hover:underline"
          >
            Preview latest issue &rarr;
          </a>
        )}
      </CardContent>
    </Card>
  );
}
