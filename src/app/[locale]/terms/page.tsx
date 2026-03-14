import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Terms of Service — Crypto Vision News",
    description:
      "Terms of service for Crypto Vision News (cryptocurrency.cv). Usage guidelines for our free crypto news API, RSS feeds, and website.",
    path: "/terms",
    locale,
    tags: ["terms of service", "usage policy", "legal", "API terms", "crypto news terms"],
  });
}

const TOC_ITEMS = [
  { id: "acceptance-of-terms", label: "1. Acceptance of Terms" },
  { id: "description-of-service", label: "2. Description of Service" },
  { id: "api-usage-terms", label: "3. API Usage Terms" },
  { id: "user-conduct", label: "4. User Conduct" },
  { id: "intellectual-property", label: "5. Intellectual Property" },
  { id: "disclaimer-of-warranties", label: "6. Disclaimer of Warranties" },
  { id: "limitation-of-liability", label: "7. Limitation of Liability" },
  { id: "indemnification", label: "8. Indemnification" },
  { id: "governing-law", label: "9. Governing Law" },
  { id: "changes-to-terms", label: "10. Changes to Terms" },
  { id: "contact-information", label: "11. Contact Information" },
] as const;

function SectionHeading({ id, number, title }: { id: string; number: number; title: string }) {
  return (
    <h2
      id={id}
      className="font-serif text-2xl font-bold mb-4 text-text-primary scroll-mt-28"
    >
      {number}. {title}
    </h2>
  );
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-text-primary">
            Terms of Service
          </h1>
          <p className="text-sm text-text-tertiary">
            Last updated: March 1, 2026
          </p>
        </div>

        <div className="flex gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="prose dark:prose-invert max-w-none text-text-secondary leading-relaxed [&_a]:text-accent [&_a]:underline [&_a]:hover:opacity-80 [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary print:text-black">
              <p className="text-lg mb-8">
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access
                to and use of Crypto Vision News, operating at{" "}
                <strong>cryptocurrency.cv</strong> (&ldquo;FCN&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
                including our website, API, RSS feeds, widgets, SDKs, and all
                associated services. Please read these Terms carefully before
                using our services.
              </p>

              {/* 1. Acceptance of Terms */}
              <section className="mb-10">
                <SectionHeading id="acceptance-of-terms" number={1} title="Acceptance of Terms" />
                <p>
                  By accessing or using any part of FCN — including our website,
                  REST API, RSS/Atom feeds, embeddable widgets, SDKs, ChatGPT
                  plugin, Claude MCP server, or any other service we provide —
                  you agree to be bound by these Terms, our{" "}
                  <a href="/privacy">Privacy Policy</a>, and all applicable laws
                  and regulations.
                </p>
                <p className="mt-3">
                  If you do not agree to these Terms, you must not access or use
                  our services. Your continued use of FCN after any changes to
                  these Terms constitutes acceptance of those changes.
                </p>
              </section>

              {/* 2. Description of Service */}
              <section className="mb-10">
                <SectionHeading id="description-of-service" number={2} title="Description of Service" />
                <p>
                  FCN is a free, open-source cryptocurrency news aggregator that
                  provides:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>News Aggregation:</strong> Real-time collection and
                    redistribution of headlines and metadata from publicly
                    available RSS/Atom feeds from cryptocurrency news publishers.
                  </li>
                  <li>
                    <strong>REST API:</strong> A JSON API for programmatic access
                    to aggregated news data, market context, and historical
                    archives.
                  </li>
                  <li>
                    <strong>RSS/Atom Feeds:</strong> Machine-readable feeds for
                    news readers, bots, and automated pipelines.
                  </li>
                  <li>
                    <strong>Market Context:</strong> Supplementary market data
                    (prices, trends) sourced from third-party providers such as
                    CoinGecko.
                  </li>
                  <li>
                    <strong>SDKs &amp; Integrations:</strong> Client libraries
                    (Python, TypeScript, Go, React, PHP), ChatGPT plugin, Claude
                    MCP server, and embeddable widgets.
                  </li>
                  <li>
                    <strong>Historical Archive:</strong> A searchable archive of
                    past news articles with market context snapshots.
                  </li>
                </ul>
                <p className="mt-4">
                  FCN does <strong>not</strong> produce original news content. We
                  aggregate and index content from third-party publishers. All
                  original content remains the property of respectively original
                  publishers.
                </p>
              </section>

              {/* 3. API Usage Terms */}
              <section className="mb-10">
                <SectionHeading id="api-usage-terms" number={3} title="API Usage Terms" />
                <h3 className="font-serif text-lg font-semibold mt-4 mb-2">
                  Free Tier
                </h3>
                <p>
                  Our API is available for free without requiring an API key for
                  basic usage. The free tier is subject to the following
                  conditions:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Rate Limits:</strong> Reasonable rate limits are
                    enforced to ensure fair access for all users. Exceeding rate
                    limits may result in temporary throttling (HTTP 429
                    responses).
                  </li>
                  <li>
                    <strong>Fair Use:</strong> The API is provided for legitimate
                    use cases including personal projects, research, education,
                    news aggregation, trading tools, and AI/LLM applications.
                  </li>
                  <li>
                    <strong>No SLA:</strong> The free tier is provided without any
                    service-level agreement. We strive for high availability but
                    make no guarantees.
                  </li>
                </ul>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Prohibited API Usage
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Excessive or abusive request volumes designed to degrade
                    service for other users.
                  </li>
                  <li>
                    Using the API to build a competing service that simply
                    mirrors our data without adding value.
                  </li>
                  <li>
                    Circumventing rate limits through multiple API keys, IP
                    rotation, or other evasion techniques.
                  </li>
                  <li>
                    Reselling raw API data without attribution or
                    transformation.
                  </li>
                  <li>
                    Using the API for any illegal activity or to facilitate
                    financial fraud.
                  </li>
                </ul>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Attribution
                </h3>
                <p>
                  When using our API data in public-facing applications, we
                  appreciate (but do not require) attribution to Crypto Vision News
                  (cryptocurrency.cv). Original news content must be attributed
                  to its respective publisher.
                </p>
              </section>

              {/* 4. User Conduct */}
              <section className="mb-10">
                <SectionHeading id="user-conduct" number={4} title="User Conduct" />
                <p>When using FCN services, you agree not to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Use the service for any unlawful purpose or in violation of
                    any applicable local, state, national, or international law.
                  </li>
                  <li>
                    Attempt to disrupt, overload, or impair the operation of our
                    services through denial-of-service attacks, spam, or other
                    malicious activity.
                  </li>
                  <li>
                    Attempt to gain unauthorized access to our systems,
                    infrastructure, or other users&apos; data.
                  </li>
                  <li>
                    Scrape or redistribute content in a way that violates
                    original publishers&apos; terms of service or applicable
                    copyright law.
                  </li>
                  <li>
                    Use our services to spread misinformation, conduct market
                    manipulation, or create artificially misleading narratives.
                  </li>
                  <li>
                    Impersonate FCN, our team, or any other person or entity.
                  </li>
                  <li>
                    Use automated access (bots, scripts, crawlers) in a manner
                    that degrades the experience for other users.
                  </li>
                </ul>
                <p className="mt-4">
                  We reserve the right to restrict or terminate access for users
                  who violate these conduct guidelines.
                </p>
              </section>

              {/* 5. Intellectual Property */}
              <section className="mb-10">
                <SectionHeading id="intellectual-property" number={5} title="Intellectual Property" />
                <h3 className="font-serif text-lg font-semibold mt-4 mb-2">
                  Aggregated Content
                </h3>
                <p>
                  News articles, headlines, summaries, and media linked through
                  FCN remain the intellectual property of their respective
                  original publishers. FCN aggregates publicly available RSS feed
                  metadata (titles, descriptions, publication dates, URLs) and
                  does not claim ownership over any third-party content.
                </p>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  FCN Source Code
                </h3>
                <p>
                  The FCN platform source code is open source and licensed under
                  the terms specified in our{" "}
                  <a
                    href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LICENSE
                  </a>{" "}
                  file. You are free to use, modify, and distribute the source
                  code in accordance with that license.
                </p>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Trademarks
                </h3>
                <p>
                  &ldquo;Crypto Vision News&rdquo;, &ldquo;cryptocurrency.cv&rdquo;,
                  and our logo are service marks of FCN. You may not use these
                  marks in a way that suggests endorsement or affiliation
                  without our written consent.
                </p>
              </section>

              {/* 6. Disclaimer of Warranties */}
              <section className="mb-10">
                <SectionHeading id="disclaimer-of-warranties" number={6} title="Disclaimer of Warranties" />
                <div className="rounded-lg border border-border bg-surface-secondary p-4 my-4">
                  <p className="font-semibold mb-2">
                    IMPORTANT: NOT FINANCIAL ADVICE
                  </p>
                  <p>
                    FCN is a news aggregation service. Nothing on our website,
                    API, feeds, or any associated service constitutes financial
                    advice, investment advice, trading advice, or any other form
                    of professional advice. Cryptocurrency markets are highly
                    volatile and speculative. Always do your own research (DYOR)
                    and consult with qualified financial professionals before
                    making any investment decisions.
                  </p>
                </div>
                <p className="mt-4">
                  FCN is provided on an <strong>&ldquo;AS IS&rdquo;</strong> and{" "}
                  <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without
                  warranties of any kind, either express or implied, including
                  but not limited to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</li>
                  <li>Accuracy, completeness, reliability, or timeliness of any news content, market data, or information provided.</li>
                  <li>Uninterrupted or error-free operation of the service, API, or feeds.</li>
                  <li>Absence of viruses, malware, or other harmful components.</li>
                  <li>Compatibility with any specific software, hardware, or network environment.</li>
                </ul>
              </section>

              {/* 7. Limitation of Liability */}
              <section className="mb-10">
                <SectionHeading id="limitation-of-liability" number={7} title="Limitation of Liability" />
                <p>
                  To the maximum extent permitted by applicable law, in no event
                  shall FCN, its contributors, maintainers, affiliates, or
                  service providers be liable for any:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Direct, indirect, incidental, special, consequential, or punitive damages.</li>
                  <li>Loss of profits, revenue, data, goodwill, or other intangible losses.</li>
                  <li>Damages resulting from your access to, use of, or inability to use the service.</li>
                  <li>Damages resulting from any unauthorized access to or alteration of your data or transmissions.</li>
                  <li>Damages resulting from any third-party content, services, or links accessed through FCN.</li>
                  <li>Any financial losses incurred as a result of acting on information provided by FCN.</li>
                </ul>
                <p className="mt-4">
                  This limitation applies regardless of the legal theory
                  (contract, tort, strict liability, or otherwise), even if FCN
                  has been advised of the possibility of such damages.
                </p>
              </section>

              {/* 8. Indemnification */}
              <section className="mb-10">
                <SectionHeading id="indemnification" number={8} title="Indemnification" />
                <p>
                  You agree to indemnify, defend, and hold harmless FCN, its
                  contributors, maintainers, and affiliates from and against any
                  and all claims, liabilities, damages, losses, costs, and
                  expenses (including reasonable attorneys&apos; fees) arising
                  from or related to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Your use of or access to FCN services.</li>
                  <li>Your violation of these Terms.</li>
                  <li>Your violation of any third-party rights, including intellectual property rights.</li>
                  <li>Any content you submit, post, or transmit through our services.</li>
                  <li>Your use of API data in a manner that causes harm to third parties.</li>
                </ul>
              </section>

              {/* 9. Governing Law */}
              <section className="mb-10">
                <SectionHeading id="governing-law" number={9} title="Governing Law" />
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of the jurisdiction in which FCN operates,
                  without regard to conflict of law principles.
                </p>
                <p className="mt-3">
                  Any disputes arising under or in connection with these Terms
                  shall be resolved through good-faith negotiation. If a
                  resolution cannot be reached, the parties agree to submit to
                  binding arbitration in accordance with the rules of a mutually
                  agreed-upon arbitration body.
                </p>
                <p className="mt-3">
                  Nothing in these Terms shall limit any rights you may have
                  under applicable consumer protection laws or other mandatory
                  provisions of law in your jurisdiction.
                </p>
              </section>

              {/* 10. Changes to Terms */}
              <section className="mb-10">
                <SectionHeading id="changes-to-terms" number={10} title="Changes to Terms" />
                <p>
                  We reserve the right to modify or replace these Terms at any
                  time. When we make changes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    The &ldquo;Last updated&rdquo; date at the top of this page
                    will be revised.
                  </li>
                  <li>
                    Material changes may be announced via our GitHub repository,
                    changelog, or on the website.
                  </li>
                  <li>
                    Continued use of our services after the update constitutes
                    acceptance of the revised Terms.
                  </li>
                </ul>
                <p className="mt-4">
                  We encourage you to review these Terms periodically. If you
                  disagree with any changes, your sole remedy is to discontinue
                  use of our services.
                </p>
              </section>

              {/* 11. Contact Information */}
              <section className="mb-10">
                <SectionHeading id="contact-information" number={11} title="Contact Information" />
                <p>
                  If you have any questions about these Terms, please contact us
                  through:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>GitHub:</strong> Open an issue on our{" "}
                    <a
                      href="https://github.com/nirholas/free-crypto-news"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub repository
                    </a>
                  </li>
                  <li>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:legal@cryptocurrency.cv">
                      legal@cryptocurrency.cv
                    </a>
                  </li>
                </ul>
                <p className="mt-4">
                  We aim to respond to all inquiries within 30 days.
                </p>
              </section>
            </div>
          </div>

          {/* Sidebar TOC (desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <nav
                aria-label="Table of contents"
                className={cn(
                  "rounded-lg border border-border bg-(--color-surface) p-5",
                  "print:hidden"
                )}
              >
                <h2 className="font-serif text-sm font-bold mb-3 text-text-primary uppercase tracking-wide">
                  Contents
                </h2>
                <ul className="space-y-2">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-text-secondary hover:text-accent transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
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