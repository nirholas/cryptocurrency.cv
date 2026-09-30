/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TEAM } from '@/data/team';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { CommunityCredits } from '@/components/CommunityCredits';
import { CONTRIBUTORS } from '@/data/contributors';
import { NonceScript } from '@/components/NonceScript';
import { generateSEOMetadata } from '@/lib/seo';
import { Users, ArrowRight, ExternalLink, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Our Team — Crypto Vision',
    description:
      'Meet the people behind Crypto Vision. Our leadership, core contributors, and open source community building the free crypto news infrastructure.',
    path: '/team',
    locale,
    tags: ['team', 'contributors', 'masthead', 'open source', 'crypto news'],
  });
}

function TeamStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Crypto Vision',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    member: TEAM.filter((m) => m.type === 'leadership').map((m) => ({
      '@type': 'Person',
      name: m.name,
      jobTitle: m.role,
      description: m.bio,
      ...(m.githubUsername && {
        sameAs: [`https://github.com/${m.githubUsername}`],
      }),
    })),
  };

  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const leadership = TEAM.filter((m) => m.type === 'leadership');
  const coreContributors = TEAM.filter((m) => m.type === 'core' || m.type === 'contributor');

  return (
    <>
      <Header />
      <TeamStructuredData />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="mb-16 pt-8 text-center">
          <Users className="text-accent mx-auto mb-4 h-10 w-10" />
          <h1 className="text-text-primary font-serif text-4xl font-bold md:text-5xl">Our Team</h1>
          <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg">
            The people behind Crypto Vision — building the free and open crypto news
            infrastructure the industry needs.
          </p>
        </section>

        {/* Leadership */}
        <section className="mb-16">
          <h2 className="text-text-primary mb-6 font-serif text-2xl font-bold md:text-3xl">
            Leadership
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {leadership.map((member) => (
              <TeamMemberCard key={member.slug} member={member} featured />
            ))}
          </div>
        </section>

        {/* Core Contributors */}
        {coreContributors.length > 0 && (
          <section className="mb-16">
            <h2 className="text-text-primary mb-6 font-serif text-2xl font-bold md:text-3xl">
              Contributors
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {coreContributors.map((member) => (
                <TeamMemberCard key={member.slug} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* Community credits */}
        <section className="mb-16" aria-labelledby="community-credits">
          <h2
            id="community-credits"
            className="text-text-primary mb-3 font-serif text-2xl font-bold md:text-3xl"
          >
            Community Credits
          </h2>
          <p className="text-text-secondary mb-6 max-w-2xl">
            Thank you to the <strong className="text-text-primary">{CONTRIBUTORS.length}</strong>{' '}
            people who have written code, reported bugs and security issues, or helped other
            users. Many fixes exist only because someone took the time to write them up.
          </p>
          <CommunityCredits />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a
              href="https://github.com/nirholas/cryptocurrency.cv/blob/main/CONTRIBUTORS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Read CONTRIBUTORS.md
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/nirholas/cryptocurrency.cv/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Commit history on GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Join Us */}
        <section className="mb-10">
          <div className="border-border bg-surface-secondary rounded-xl border p-8 md:p-12">
            <h2 className="text-text-primary mb-3 font-serif text-2xl font-bold md:text-3xl">
              Join Us
            </h2>
            <p className="text-text-secondary mb-6 max-w-2xl">
              We&apos;re always looking for contributors. Whether you&apos;re fixing bugs, adding
              features, translating, or improving docs, every contribution matters, and so does a
              good bug report.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/nirholas/cryptocurrency.cv/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-text-primary hover:border-accent/50 hover:text-accent inline-flex items-center gap-2 rounded-lg border bg-(--color-surface) px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View open issues on GitHub
              </a>
              <a
                href="https://github.com/nirholas/cryptocurrency.cv/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-text-primary hover:border-accent/50 hover:text-accent inline-flex items-center gap-2 rounded-lg border bg-(--color-surface) px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Read our contributing guide
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
