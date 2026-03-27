/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Editorial Policy — Crypto Vision News',
    description:
      'Editorial guidelines, source selection criteria, AI usage disclosure, sponsored content policy, and corrections process for Crypto Vision News.',
    path: '/editorial-policy',
    locale,
    tags: [
      'editorial policy',
      'source selection',
      'AI disclosure',
      'sponsored content',
      'corrections',
      'crypto news',
    ],
  });
}

const TOC_ITEMS = [
  { id: 'our-mission', label: '1. Our Mission' },
  { id: 'source-selection-criteria', label: '2. Source Selection Criteria' },
  { id: 'content-curation', label: '3. Content Curation' },
  { id: 'corrections-and-accuracy', label: '4. Corrections & Accuracy' },
  { id: 'conflicts-of-interest', label: '5. Conflicts of Interest' },
  { id: 'ai-and-automation-disclosure', label: '6. AI & Automation Disclosure' },
  { id: 'sponsored-content-policy', label: '7. Sponsored Content Policy' },
  { id: 'user-generated-content', label: '8. User-Generated Content' },
  { id: 'contact', label: '9. Contact' },
] as const;

function SectionHeading({ id, number, title }: { id: string; number: number; title: string }) {
  return (
    <h2
      id={id}
      className="mb-4 scroll-mt-28 font-serif text-2xl font-bold text-text-primary"
    >
      {number}. {title}
    </h2>
  );
}

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="mb-3 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Editorial Policy
          </h1>
          <p className="text-sm text-text-tertiary">Last updated: March 1, 2026</p>
        </div>

        <div className="flex gap-10">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            <div className="prose dark:prose-invert max-w-none leading-relaxed text-text-secondary print:text-black [&_a]:text-accent [&_a]:underline [&_a]:hover:opacity-80 [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary">
              <p className="mb-8 text-lg">
                Crypto Vision News is committed to providing free, unbiased, and comprehensive
                crypto news aggregation. This editorial policy explains how we select sources,
                curate content, handle corrections, and maintain transparency about our processes.
                We also publish a companion <a href="/ethics">Ethics Statement</a> outlining our
                core principles.
              </p>

              {/* 1. Our Mission */}
              <section className="mb-10">
                <SectionHeading id="our-mission" number={1} title="Our Mission" />
                <p>
                  Crypto Vision News aims to provide free, unbiased, comprehensive crypto news
                  aggregation for everyone. We believe that access to timely, accurate information
                  about cryptocurrency markets and blockchain technology should not be gated behind
                  paywalls or require expensive subscriptions.
                </p>
                <p className="mt-3">
                  Our goal is to aggregate the best crypto journalism from around the world into a
                  single, easy-to-use platform — available via our website, REST API, RSS feeds,
                  SDKs, and integrations — so that traders, developers, researchers, and enthusiasts
                  can stay informed.
                </p>
              </section>

              {/* 2. Source Selection Criteria */}
              <section className="mb-10">
                <SectionHeading
                  id="source-selection-criteria"
                  number={2}
                  title="Source Selection Criteria"
                />
                <p>
                  We carefully evaluate every news source before adding it to our aggregation
                  pipeline. Our selection criteria include:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Editorial reputation and track record:</strong> Sources must have a
                    demonstrated history of credible reporting.
                  </li>
                  <li>
                    <strong>Factual accuracy history:</strong> We monitor sources for repeated
                    inaccuracies or misleading headlines.
                  </li>
                  <li>
                    <strong>Regular publishing cadence:</strong> Sources must actively publish
                    content on a regular basis.
                  </li>
                  <li>
                    <strong>Coverage breadth:</strong> We favor sources that cover a range of topics
                    rather than only promoting a single project or narrative.
                  </li>
                  <li>
                    <strong>No pay-to-play:</strong> Sources are never paid to be included in our
                    aggregation. Inclusion is based solely on editorial merit.
                  </li>
                  <li>
                    <strong>Removal policy:</strong> Sources can be removed for persistent
                    inaccuracy, misleading content, or failure to meet our editorial standards.
                  </li>
                </ul>
              </section>

              {/* 3. Content Curation */}
              <section className="mb-10">
                <SectionHeading id="content-curation" number={3} title="Content Curation" />
                <p>How articles are ranked and presented on our platform:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Chronological by default:</strong> Articles are displayed newest first,
                    ensuring timeliness.
                  </li>
                  <li>
                    <strong>No manual editorial boosting:</strong> We do not manually promote or
                    suppress specific articles.
                  </li>
                  <li>
                    <strong>Algorithm transparency:</strong> Articles are ranked by recency, source
                    quality tier, and topic relevance — never by commercial relationships or
                    advertising spend.
                  </li>
                  <li>
                    <strong>AI usage:</strong> AI is used for categorization, summarization, and
                    translation — not for generating original reporting. See our{' '}
                    <a href="#ai-and-automation-disclosure">AI &amp; Automation Disclosure</a> below
                    for full details.
                  </li>
                </ul>
              </section>

              {/* 4. Corrections & Accuracy */}
              <section className="mb-10">
                <SectionHeading
                  id="corrections-and-accuracy"
                  number={4}
                  title="Corrections & Accuracy"
                />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    We aggregate content as-is from source publications. We do not alter headlines
                    or article content.
                  </li>
                  <li>
                    If a source publishes a correction or retraction, it is reflected in our feed
                    when the source updates their RSS/Atom feed.
                  </li>
                  <li>
                    Factual errors in our own content (learn articles, guides, glossary entries) can
                    be reported via our <a href="/contact">contact page</a> or by opening an issue
                    on{' '}
                    <a
                      href="https://github.com/nirholas/free-crypto-news/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                    .
                  </li>
                  <li>
                    We label content types clearly: <strong>News</strong>, <strong>Opinion</strong>,{' '}
                    <strong>Sponsored</strong>, and <strong>Press Release</strong>.
                  </li>
                </ul>
              </section>

              {/* 5. Conflicts of Interest */}
              <section className="mb-10">
                <SectionHeading
                  id="conflicts-of-interest"
                  number={5}
                  title="Conflicts of Interest"
                />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Crypto Vision News does not hold positions in cryptocurrencies as an
                    organization.
                  </li>
                  <li>
                    Individual contributors may hold crypto assets; this does not influence source
                    selection or article ranking.
                  </li>
                  <li>
                    Sponsored content is always clearly labeled and separated from editorial
                    content.
                  </li>
                  <li>API partnerships do not influence editorial content or source ranking.</li>
                </ul>
              </section>

              {/* 6. AI & Automation Disclosure */}
              <section className="mb-10">
                <SectionHeading
                  id="ai-and-automation-disclosure"
                  number={6}
                  title="AI & Automation Disclosure"
                />
                <p>
                  We are transparent about how we use artificial intelligence and automation in our
                  platform:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Categorization &amp; tagging:</strong> AI is used to automatically
                    categorize articles by topic (Bitcoin, Ethereum, DeFi, regulation, etc.) and
                    apply relevant tags.
                  </li>
                  <li>
                    <strong>Summarization:</strong> AI-generated summaries are clearly labeled as
                    such. They are provided as a convenience and do not replace the original
                    article.
                  </li>
                  <li>
                    <strong>Translation:</strong> AI powers our multi-language support, translating
                    headlines and metadata into 40+ languages.
                  </li>
                  <li>
                    <strong>No AI-generated journalism:</strong> We never present AI-generated
                    articles as human-written journalism. All original reporting comes from the
                    source publications we aggregate.
                  </li>
                  <li>
                    <strong>AI content detection:</strong> Our AI content detection endpoint is
                    publicly available via the API, allowing users to verify content provenance.
                  </li>
                </ul>
              </section>

              {/* 7. Sponsored Content Policy */}
              <section className="mb-10">
                <SectionHeading
                  id="sponsored-content-policy"
                  number={7}
                  title="Sponsored Content Policy"
                />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    All sponsored or paid content is clearly marked with a{' '}
                    <strong>&ldquo;Sponsored&rdquo;</strong> label.
                  </li>
                  <li>
                    Sponsored content does not appear in the main news feed by default. Users must
                    explicitly opt in to see sponsored content.
                  </li>
                  <li>Press releases are separated into their own section and clearly labeled.</li>
                  <li>
                    Advertising does not influence which articles appear in feeds, API responses, or
                    RSS output.
                  </li>
                </ul>
                <p className="mt-4">
                  For details about advertising opportunities, see our{' '}
                  <a href="/advertise">Advertise</a> page.
                </p>
              </section>

              {/* 8. User-Generated Content */}
              <section className="mb-10">
                <SectionHeading
                  id="user-generated-content"
                  number={8}
                  title="User-Generated Content"
                />
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    User comments, if enabled, do not represent editorial views of Crypto Vision
                    News.
                  </li>
                  <li>
                    Community contributions to guides and glossary entries are reviewed by our
                    editorial team before publishing.
                  </li>
                </ul>
              </section>

              {/* 9. Contact */}
              <section className="mb-10">
                <SectionHeading id="contact" number={9} title="Contact" />
                <p>
                  If you have editorial concerns, need to report a correction, or want to file a
                  complaint about our content or sourcing, please reach out through one of the
                  following channels:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Contact page:</strong> <a href="/contact">cryptocurrency.cv/contact</a>
                  </li>
                  <li>
                    <strong>GitHub Issues:</strong>{' '}
                    <a
                      href="https://github.com/nirholas/free-crypto-news/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open an issue
                    </a>
                  </li>
                </ul>
                <p className="mt-4">We aim to respond to all editorial inquiries within 30 days.</p>
              </section>
            </div>
          </div>

          {/* Sidebar TOC (desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <nav
                aria-label="Table of contents"
                className={cn(
                  'rounded-lg border border-border bg-(--color-surface) p-5',
                  'print:hidden',
                )}
              >
                <h2 className="mb-3 font-serif text-sm font-bold tracking-wide text-text-primary uppercase">
                  Contents
                </h2>
                <ul className="space-y-2">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-text-secondary transition-colors hover:text-accent"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Related Pages */}
              <div className="mt-4 rounded-lg border border-border bg-(--color-surface) p-5 print:hidden">
                <h2 className="mb-3 font-serif text-sm font-bold tracking-wide text-text-primary uppercase">
                  Related
                </h2>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/ethics"
                      className="text-sm text-text-secondary transition-colors hover:text-accent"
                    >
                      Ethics Statement
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-sm text-text-secondary transition-colors hover:text-accent"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-sm text-text-secondary transition-colors hover:text-accent"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      {/* Print styles */}
      <style>{`
        @media print {
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          .prose { font-size: 12pt !important; color: black !important; }
          .prose a { color: black !important; text-decoration: underline !important; }
          .prose a::after { content: " (" attr(href) ")"; font-size: 10pt; }
        }
      `}</style>
    </>
  );
}
