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
    title: 'Advertise — Crypto Vision News',
    description:
      'Reach crypto-native audiences with display ads, sponsored content, and newsletter placements on Crypto Vision News.',
    path: '/advertise',
    locale,
    tags: ['advertise', 'sponsor', 'crypto advertising', 'crypto news'],
  });
}

export default async function AdvertisePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="mb-3 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Advertise with Us
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">
            Connect your brand with a highly engaged crypto audience. We offer transparent, clearly
            labeled advertising placements across our platform.
          </p>
        </div>

        <div className="max-w-3xl">
          <div className="prose dark:prose-invert max-w-none leading-relaxed text-text-secondary [&_a]:text-accent [&_a]:underline [&_a]:hover:opacity-80 [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary">
            {/* Audience Stats */}
            <section className="mb-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Monthly Visitors', value: '500K+' },
                { label: 'API Consumers', value: '10K+' },
                { label: 'Newsletter Subscribers', value: '25K+' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border bg-(--color-surface) p-6 text-center"
                >
                  <p className="text-3xl font-bold text-accent">{stat.value}</p>
                  <p className="mt-1 text-sm text-text-tertiary">{stat.label}</p>
                </div>
              ))}
            </section>

            {/* Ad Formats */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">Ad Formats</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-1 font-serif text-lg font-semibold">Display Ads</h3>
                  <p>
                    Banner and sidebar placements across our website. All ads are clearly labeled as
                    advertising and do not influence editorial content.
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-lg font-semibold">Sponsored Content</h3>
                  <p>
                    Branded articles and press releases distributed through our platform. All
                    sponsored content is prominently labeled per our{' '}
                    <a href="/advertising-disclosure">advertising disclosure policy</a>.
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-serif text-lg font-semibold">Newsletter Placements</h3>
                  <p>
                    Featured spots in our daily and weekly email digests reaching thousands of
                    crypto professionals and enthusiasts.
                  </p>
                </div>
              </div>
            </section>

            {/* Guidelines */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold">Advertising Guidelines</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>All advertisements must be clearly distinguishable from editorial content.</li>
                <li>We do not accept ads for unregistered securities or fraudulent projects.</li>
                <li>Advertising never influences our editorial decisions or content ranking.</li>
                <li>
                  We reserve the right to reject any advertisement that conflicts with our{' '}
                  <a href="/ethics">ethics statement</a>.
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section className="mb-10 rounded-lg border border-border bg-(--color-surface) p-6">
              <h2 className="mb-3 font-serif text-lg font-bold text-text-primary">
                Get in Touch
              </h2>
              <p>
                For advertising inquiries, rate cards, and custom packages, please contact us at{' '}
                <a href="mailto:ads@cryptovisionnews.com">ads@cryptovisionnews.com</a>.
              </p>
              <p className="mt-3 text-sm text-text-tertiary">
                See our <a href="/advertising-disclosure">Advertising Disclosure</a> for full
                transparency on how we handle advertising.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
