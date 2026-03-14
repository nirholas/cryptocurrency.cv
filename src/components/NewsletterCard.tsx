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
    <Card className="group h-full transition-colors hover:border-[var(--color-accent)]/50">
      <CardContent className="flex h-full flex-col p-6">
        {/* Icon + Name */}
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] transition-transform group-hover:scale-110">
            <Icon className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/newsletters/${newsletter.slug}`}
              className="font-bold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              {newsletter.name}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{FREQUENCY_LABELS[newsletter.frequency]}</Badge>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {CATEGORY_LABELS[newsletter.category]}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {newsletter.description}
        </p>

        {/* Sample Subject  */}
        <div className="mb-4 rounded-lg bg-[var(--color-surface-secondary)] p-3 text-xs">
          <span className="mb-0.5 block text-[var(--color-text-tertiary)]">Sample subject:</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {newsletter.sampleSubject}
          </span>
        </div>

        {/* Subscribe Form */}
        <NewsletterSubscribeForm newsletterIds={[newsletter.id]} compact />

        {/* Preview link */}
        {newsletter.previewUrl && (
          <a
            href={newsletter.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs text-[var(--color-accent)] hover:underline"
          >
            Preview latest issue &rarr;
          </a>
        )}
      </CardContent>
    </Card>
  );
}
