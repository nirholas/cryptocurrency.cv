/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Newsletters Hub Page
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/Badge';
import { generateSEOMetadata } from '@/lib/seo';
import { NEWSLETTERS } from '@/lib/newsletters';
import { Mail } from 'lucide-react';
import NewsletterCard from '@/components/NewsletterCard';
import NewsletterSubscribeAll from '@/components/NewsletterSubscribeAll';
import type { Metadata } from 'next';

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Newsletters — Free Crypto News',
    description:
      'Subscribe to free crypto newsletters: daily digest, market analysis, DeFi updates, developer news, and educational content delivered to your inbox.',
    path: '/newsletters',
    locale,
    tags: [
      'crypto newsletter',
      'bitcoin newsletter',
      'crypto email',
      'market analysis',
      'defi newsletter',
      'crypto education',
    ],
  });
}

const FAQ = [
  {
    q: 'How often will I receive emails?',
    a: 'It depends on the newsletter you choose. Daily Digest arrives every morning, weekly newsletters arrive once per week, and biweekly arrive every two weeks.',
  },
  {
    q: 'Can I unsubscribe?',
    a: 'Yes, you can unsubscribe at any time via the link at the bottom of any email. No questions asked.',
  },
  {
    q: 'What about my privacy?',
    a: 'We never sell or share your email with third parties. Your data is used only to send the newsletters you subscribe to.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, all of our newsletters are completely free. No credit card required.',
  },
];

export default async function NewslettersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="container-main py-10 text-center lg:py-14">
            <Badge className="mb-4">
              <Mail className="mr-1 h-3 w-3" /> Newsletters
            </Badge>
            <h1 className="mb-4 font-serif text-3xl font-bold text-text-primary md:text-4xl lg:text-5xl">
              Newsletters
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-text-secondary">
              Stay informed with curated crypto intelligence delivered to your inbox.
            </p>
            <NewsletterSubscribeAll />
          </div>
        </section>

        {/* Newsletter Grid */}
        <section className="border-b border-border">
          <div className="container-main py-8 lg:py-12">
            <div className="grid gap-6 sm:grid-cols-2">
              {NEWSLETTERS.map((newsletter) => (
                <NewsletterCard key={newsletter.id} newsletter={newsletter} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="container-main py-8 lg:py-12">
            <h2 className="mb-8 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-2xl space-y-6">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <h3 className="mb-1 text-sm font-bold text-text-primary">
                    {item.q}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
