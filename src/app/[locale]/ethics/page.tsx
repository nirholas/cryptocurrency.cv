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
    title: 'Ethics Statement — Crypto Vision News',
    description:
      'Core ethical principles and compliance standards for Crypto Vision News. Accuracy, transparency, independence, accessibility, privacy, and open source.',
    path: '/ethics',
    locale,
    tags: [
      'ethics',
      'principles',
      'compliance',
      'GDPR',
      'transparency',
      'open source',
      'crypto news',
    ],
  });
}

export default async function EthicsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="mb-3 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Ethics Statement
          </h1>
          <p className="text-sm text-text-tertiary">Last updated: March 1, 2026</p>
        </div>

        <div className="max-w-3xl">
          <div className="prose dark:prose-invert max-w-none leading-relaxed text-text-secondary print:text-black [&_a]:text-accent [&_a]:underline [&_a]:hover:opacity-80 [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary">
            <p className="mb-8 text-lg">
              This ethics statement outlines the core principles that guide everything we do at
              Crypto Vision News. For detailed guidelines on how we select sources, curate content,
              and handle corrections, see our full <a href="/editorial-policy">Editorial Policy</a>.
            </p>

            {/* Core Principles */}
            <section className="mb-10">
              <h2 className="mb-6 font-serif text-2xl font-bold text-text-primary">
                Core Principles
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    1
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Accuracy</h3>
                    <p>
                      We only aggregate from verified news sources with demonstrated editorial
                      standards. Sources are continuously monitored and can be removed for
                      persistent inaccuracy.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    2
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Transparency</h3>
                    <p>
                      Our algorithms and data sources are documented. We disclose how AI is used in
                      content curation, and our ranking criteria are publicly explained.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    3
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Independence</h3>
                    <p>
                      No commercial relationship influences content ranking. Advertising and API
                      partnerships are kept strictly separate from editorial decisions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    4
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Accessibility</h3>
                    <p>
                      A free tier is always available. We do not paywall aggregated news. Everyone
                      deserves access to timely crypto news regardless of their ability to pay.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    5
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Privacy</h3>
                    <p>
                      We collect minimal data and do not track users beyond anonymized analytics. No
                      API keys are required for basic usage. See our{' '}
                      <a href="/privacy">Privacy Policy</a> for details.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    6
                  </span>
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">Open Source</h3>
                    <p>
                      Our code is publicly auditable on{' '}
                      <a
                        href="https://github.com/nirholas/free-crypto-news"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </a>
                      . Anyone can inspect, fork, self-host, or contribute to the project.
                      Transparency through code.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Compliance */}
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-bold text-text-primary">
                Compliance
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>GDPR compliant:</strong> We respect data protection regulations and
                  provide users with control over their data.
                </li>
                <li>
                  <strong>No misleading financial claims:</strong> We do not provide financial
                  advice. All market data is informational only.
                </li>
                <li>
                  <strong>Age-appropriate content only:</strong> We do not aggregate or promote
                  content inappropriate for general audiences.
                </li>
                <li>
                  <strong>Intellectual property:</strong> We respect the intellectual property of
                  source publishers through proper attribution and always link back to the original
                  article.
                </li>
              </ul>
            </section>

            {/* Related Pages */}
            <section className="mb-10 rounded-lg border border-border bg-(--color-surface) p-6">
              <h2 className="mb-3 font-serif text-lg font-bold text-text-primary">
                Related Policies
              </h2>
              <ul className="mb-0 list-disc space-y-2 pl-5">
                <li>
                  <a href="/editorial-policy">Editorial Policy</a> — Detailed guidelines on source
                  selection, content curation, and corrections
                </li>
                <li>
                  <a href="/privacy">Privacy Policy</a> — How we handle your data
                </li>
                <li>
                  <a href="/terms">Terms of Service</a> — Usage terms for our platform and API
                </li>
              </ul>
            </section>
          </div>
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
