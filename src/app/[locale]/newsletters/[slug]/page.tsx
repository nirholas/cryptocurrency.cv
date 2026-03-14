/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Individual Newsletter Page
 */

import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { generateSEOMetadata } from '@/lib/seo';
import { NEWSLETTERS, getNewsletterBySlug } from '@/lib/newsletters';
import { Newspaper, TrendingUp, Layers, Code, GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import NewsletterSubscribeForm from '@/components/NewsletterSubscribeForm';
import type { Metadata } from 'next';

export const revalidate = 3600;

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

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return NEWSLETTERS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const newsletter = getNewsletterBySlug(slug);

  if (!newsletter) {
    return { title: 'Newsletter Not Found' };
  }

  return generateSEOMetadata({
    title: `${newsletter.name} Newsletter — Free Crypto News`,
    description: newsletter.description,
    path: `/newsletters/${newsletter.slug}`,
    locale,
    tags: [
      'crypto newsletter',
      newsletter.category,
      newsletter.name.toLowerCase(),
      `${newsletter.frequency} newsletter`,
    ],
  });
}

const FAQ_BY_CATEGORY: Record<string, { q: string; a: string }[]> = {
  news: [
    {
      q: 'What sources do you pull from?',
      a: 'We aggregate from 300+ trusted crypto news sources including CoinDesk, CoinTelegraph, The Block, and more.',
    },
    {
      q: 'When does it arrive?',
      a: 'The Daily Digest lands in your inbox every morning before markets open, so you start each day informed.',
    },
  ],
  markets: [
    {
      q: 'What data is included?',
      a: 'Price charts, on-chain metrics, funding rates, exchange flows, stablecoin supply changes, and sentiment indicators.',
    },
    {
      q: 'Is this trading advice?',
      a: 'No. Market Pulse is for informational purposes only. Always do your own research before making investment decisions.',
    },
  ],
  defi: [
    {
      q: 'Which protocols do you cover?',
      a: 'All major DeFi protocols across Ethereum, Solana, Arbitrum, Base, and other chains — from Aave and Uniswap to newer projects.',
    },
    {
      q: 'Do you cover security incidents?',
      a: 'Yes. We report on hacks, exploits, and audit findings so you can protect your assets.',
    },
  ],
  developer: [
    {
      q: 'Is this for API users?',
      a: 'Yes. Developer Weekly covers API changes, new endpoints, SDK releases, and best practices for integrating with our platform.',
    },
    {
      q: 'Will I get breaking change alerts?',
      a: 'Absolutely. Any breaking API changes are announced in the newsletter before they go live.',
    },
  ],
  education: [
    {
      q: 'Is this good for beginners?',
      a: 'Yes! Learn Crypto is written specifically for newcomers. We avoid jargon and explain concepts from the ground up.',
    },
    {
      q: 'What topics do you cover?',
      a: 'Everything from Bitcoin basics to advanced DeFi strategies, security best practices, and how blockchain technology works.',
    },
  ],
};

export default async function NewsletterSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const newsletter = getNewsletterBySlug(slug);
  if (!newsletter) {
    notFound();
  }

  const Icon = ICON_MAP[newsletter.icon] || Mail;
  const faq = FAQ_BY_CATEGORY[newsletter.category] || [];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {/* Back link */}
        <div className="container-main pt-6">
          <Link
            href="/newsletters"
            className="text-text-secondary hover:text-accent inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Newsletters
          </Link>
        </div>

        {/* Hero */}
        <section className="border-border border-b">
          <div className="container-main py-10 lg:py-14">
            <div className="mb-6 flex items-start gap-4">
              <div className="bg-surface-secondary flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                <Icon className="text-accent h-7 w-7" />
              </div>
              <div>
                <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
                  {newsletter.name}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge>{FREQUENCY_LABELS[newsletter.frequency]}</Badge>
                  <span className="text-text-tertiary text-sm">
                    {CATEGORY_LABELS[newsletter.category]}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-text-secondary mb-8 max-w-2xl text-lg">{newsletter.description}</p>

            {/* Subscribe Form */}
            <div className="max-w-md">
              <NewsletterSubscribeForm newsletterIds={[newsletter.id]} />
              <p className="text-text-tertiary mt-2 text-[11px]">
                Free forever. No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Sample Issue Preview */}
        <section className="border-border border-b">
          <div className="container-main py-8 lg:py-10">
            <h2 className="mb-6 font-serif text-xl font-bold">Sample Issue Preview</h2>
            <Card>
              <CardContent className="p-6">
                <div className="bg-surface-secondary rounded-lg p-4">
                  <div className="text-text-tertiary mb-3 flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" />
                    <span>From: Free Crypto News</span>
                  </div>
                  <div className="text-text-primary mb-1 text-sm font-semibold">
                    Subject: {newsletter.sampleSubject}
                  </div>
                  <div className="text-text-tertiary text-xs">To: you@example.com</div>
                </div>
                <div className="text-text-secondary mt-4 text-sm leading-relaxed">
                  <p>
                    This is a preview of what a typical {newsletter.name} email looks like. Each
                    issue includes curated content tailored to the {newsletter.category} category,
                    delivered{' '}
                    {newsletter.frequency === 'daily'
                      ? 'every morning'
                      : newsletter.frequency === 'weekly'
                        ? 'once per week'
                        : 'every two weeks'}
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Past Issues */}
        <section className="border-border border-b">
          <div className="container-main py-8 lg:py-10">
            <h2 className="mb-6 font-serif text-xl font-bold">Past Issues</h2>
            <p className="text-text-tertiary text-sm">
              Past issues will appear here once published.
            </p>
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section>
            <div className="container-main py-8 lg:py-10">
              <h2 className="text-text-primary mb-6 font-serif text-2xl font-bold">
                Frequently Asked Questions
              </h2>
              <div className="max-w-2xl space-y-6">
                {faq.map((item) => (
                  <div key={item.q}>
                    <h3 className="text-text-primary mb-1 text-sm font-bold">{item.q}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
