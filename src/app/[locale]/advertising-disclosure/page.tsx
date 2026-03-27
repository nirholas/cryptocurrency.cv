/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Advertising Disclosure — Crypto Vision News',
    description:
      'How Crypto Vision News handles advertising, sponsored content, and affiliate relationships while maintaining editorial independence.',
    path: '/advertising-disclosure',
    locale,
    tags: ['advertising disclosure', 'transparency', 'editorial independence', 'sponsored content'],
  });
}

export default async function AdvertisingDisclosurePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="mb-3 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Advertising Disclosure
          </h1>
          <p className="text-sm text-text-tertiary">Last updated: March 1, 2026</p>
        </div>

        <div className="max-w-3xl">
          <div className="prose dark:prose-invert max-w-none leading-relaxed text-text-secondary [&_a]:text-accent [&_a]:underline [&_a]:hover:opacity-80 [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary">
            <p className="mb-8 text-lg">
              Crypto Vision News is committed to transparency about how we fund our operations. This
              disclosure explains our advertising practices, how we label paid content, and the
              measures we take to protect editorial independence.
            </p>

            {/* Editorial Independence */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">Editorial Independence</h2>
              <p>
                Our editorial team operates independently from our business and advertising teams.
                Advertisers and sponsors have <strong>no influence</strong> over:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Which news articles are published or aggregated</li>
                <li>How content is ranked or featured on the platform</li>
                <li>The opinions or analysis expressed in editorial content</li>
                <li>Source selection, removal, or scoring criteria</li>
              </ul>
            </section>

            {/* Labeling */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">How We Label Advertising</h2>
              <p>
                All paid content on our platform is clearly labeled. You will see one of the
                following indicators:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>&ldquo;Sponsored&rdquo;</strong> — Content paid for by a third party and
                  clearly marked as such.
                </li>
                <li>
                  <strong>&ldquo;Ad&rdquo; or &ldquo;Advertisement&rdquo;</strong> — Display ads,
                  banners, and promotional placements.
                </li>
                <li>
                  <strong>&ldquo;Press Release&rdquo;</strong> — Submitted by projects and published
                  as-is with a press release label.
                </li>
                <li>
                  <strong>&ldquo;Affiliate&rdquo;</strong> — Links that may earn us a commission at
                  no extra cost to you.
                </li>
              </ul>
            </section>

            {/* Compensation Types */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">Types of Compensation</h2>
              <p>Crypto Vision News may receive compensation through:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Display advertising:</strong> Banner and sidebar ads served on our
                  website.
                </li>
                <li>
                  <strong>Sponsored articles:</strong> Branded content created in partnership with
                  advertisers, always labeled.
                </li>
                <li>
                  <strong>Affiliate partnerships:</strong> Commission-based links to exchanges,
                  wallets, and services.
                </li>
                <li>
                  <strong>Press release distribution:</strong> Paid tiers for priority distribution
                  of project announcements.
                </li>
                <li>
                  <strong>Newsletter sponsorship:</strong> Featured placements in our email digests.
                </li>
              </ul>
            </section>

            {/* What We Don't Do */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">What We Do Not Do</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>We never publish paid content disguised as editorial coverage.</li>
                <li>We never accept payment to influence rankings or news feeds.</li>
                <li>We never promote unregistered securities or known scam projects.</li>
                <li>We never share user data with advertisers without explicit consent.</li>
              </ul>
            </section>

            {/* Complaints */}
            <section className="mb-10 rounded-lg border border-border bg-(--color-surface) p-6">
              <h2 className="mb-3 font-serif text-lg font-bold text-text-primary">
                Questions or Complaints
              </h2>
              <p>
                If you believe advertising content has not been properly disclosed, or if you have
                concerns about any content on our platform, please contact us at{' '}
                <a href="mailto:ethics@cryptovisionnews.com">ethics@cryptovisionnews.com</a>.
              </p>
              <p className="mt-3">
                See also our <a href="/ethics">Ethics Statement</a> and{' '}
                <a href="/editorial-policy">Editorial Policy</a> for related guidelines.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
