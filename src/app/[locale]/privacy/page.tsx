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
    title: "Privacy Policy — Crypto Vision News",
    description:
      "Privacy policy for Crypto Vision News (cryptocurrency.cv). Learn how we handle your data — we collect minimal information and respect your privacy.",
    path: "/privacy",
    locale,
    tags: ["privacy policy", "data protection", "GDPR", "CCPA", "crypto news privacy"],
  });
}

const TOC_ITEMS = [
  { id: "information-we-collect", label: "1. Information We Collect" },
  { id: "how-we-use-information", label: "2. How We Use Information" },
  { id: "cookies-and-tracking", label: "3. Cookies & Tracking" },
  { id: "third-party-services", label: "4. Third-Party Services" },
  { id: "data-retention", label: "5. Data Retention" },
  { id: "your-rights", label: "6. Your Rights" },
  { id: "api-usage-data", label: "7. API Usage Data" },
  { id: "childrens-privacy", label: "8. Children's Privacy" },
  { id: "changes-to-policy", label: "9. Changes to This Policy" },
  { id: "contact-us", label: "10. Contact Us" },
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

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-text-primary">
            Privacy Policy
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
                Crypto Vision News, operating at{" "}
                <strong>cryptocurrency.cv</strong> (&ldquo;FCN&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), is
                committed to protecting your privacy. This Privacy Policy
                explains what information we collect, how we use it, and your
                rights regarding that information. We believe in transparency and
                minimal data collection.
              </p>

              {/* 1. Information We Collect */}
              <section className="mb-10">
                <SectionHeading id="information-we-collect" number={1} title="Information We Collect" />
                <p>
                  FCN is designed to be privacy-first. We do not require user
                  accounts, API keys (for basic usage), or any form of
                  registration. The information we collect is minimal:
                </p>
                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Automatically Collected Information
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Usage Analytics:</strong> We use Vercel Analytics, a
                    privacy-friendly analytics service, to understand how our
                    site is used. This collects anonymized, aggregated data such
                    as page views, referral sources, browser type, and
                    approximate geographic region. Vercel Analytics does not use
                    cookies and does not track individual users across sessions.
                  </li>
                  <li>
                    <strong>Server Logs:</strong> Our hosting provider (Vercel)
                    may collect standard server access logs, including IP
                    addresses, request timestamps, request paths, HTTP methods,
                    and user-agent strings. These logs are used for operational
                    monitoring, debugging, and abuse prevention.
                  </li>
                  <li>
                    <strong>Performance Metrics:</strong> Vercel Speed Insights
                    may collect anonymous Web Vitals performance data (e.g., load
                    times, layout shifts) to help us optimize the user
                    experience.
                  </li>
                </ul>
                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Information We Do NOT Collect
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Personal identification information (names, emails, phone numbers)</li>
                  <li>Financial or cryptocurrency wallet addresses</li>
                  <li>Location data beyond approximate region from IP</li>
                  <li>Social media profiles or credentials</li>
                  <li>Payment information</li>
                </ul>
              </section>

              {/* 2. How We Use Information */}
              <section className="mb-10">
                <SectionHeading id="how-we-use-information" number={2} title="How We Use Information" />
                <p>The limited information we collect is used for:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Service Operation:</strong> Ensuring our website, API,
                    and RSS feeds function correctly and remain accessible.
                  </li>
                  <li>
                    <strong>Performance Optimization:</strong> Identifying slow
                    pages, API bottlenecks, or infrastructure issues to improve
                    response times and reliability.
                  </li>
                  <li>
                    <strong>Abuse Prevention:</strong> Detecting and mitigating
                    automated abuse, denial-of-service attacks, or other
                    malicious activity against our services.
                  </li>
                  <li>
                    <strong>Content Improvement:</strong> Understanding which
                    categories, coins, and features are popular to prioritize
                    development efforts.
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> Meeting any applicable
                    legal obligations or responding to lawful requests from
                    authorities.
                  </li>
                </ul>
                <p className="mt-4">
                  We do <strong>not</strong> sell, rent, or share any data with
                  third parties for advertising, marketing, or profiling
                  purposes.
                </p>
              </section>

              {/* 3. Cookies and Tracking */}
              <section className="mb-10">
                <SectionHeading id="cookies-and-tracking" number={3} title="Cookies and Tracking" />
                <h3 className="font-serif text-lg font-semibold mt-4 mb-2">
                  Cookies
                </h3>
                <p>
                  FCN does <strong>not</strong> use advertising or tracking
                  cookies. We may set minimal, strictly necessary cookies for:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Locale/Language preference:</strong> Storing your
                    selected language so it persists across page navigation.
                  </li>
                  <li>
                    <strong>Theme preference:</strong> Remembering your dark/light
                    mode selection.
                  </li>
                </ul>
                <p className="mt-4">
                  These cookies contain no personal information and are not shared
                  with any third party.
                </p>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Local Storage
                </h3>
                <p>
                  We use your browser&apos;s <code>localStorage</code> to save
                  user preferences such as theme selection, preferred categories,
                  and display settings. This data never leaves your device and is
                  not transmitted to our servers.
                </p>

                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Vercel Analytics
                </h3>
                <p>
                  Vercel Analytics is a privacy-focused analytics tool that
                  collects anonymized usage data without cookies. It does not
                  track individual users, does not create user profiles, and
                  complies with GDPR without requiring cookie consent. Learn more
                  at{" "}
                  <a
                    href="https://vercel.com/docs/analytics/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vercel&apos;s Analytics Privacy Policy
                  </a>
                  .
                </p>
              </section>

              {/* 4. Third-Party Services */}
              <section className="mb-10">
                <SectionHeading id="third-party-services" number={4} title="Third-Party Services" />
                <p>
                  Our service integrates with the following third-party services.
                  Each has its own privacy policy governing its data practices:
                </p>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-semibold">Service</th>
                        <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                        <th className="text-left py-2 font-semibold">Data Shared</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-2 pr-4"><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel</a></td>
                        <td className="py-2 pr-4">Hosting, analytics, edge functions</td>
                        <td className="py-2">Anonymized analytics, server logs</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Fonts</a></td>
                        <td className="py-2 pr-4">Typography (Inter, serif fonts)</td>
                        <td className="py-2">IP address (via font requests)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><a href="https://www.coingecko.com/en/privacy" target="_blank" rel="noopener noreferrer">CoinGecko API</a></td>
                        <td className="py-2 pr-4">Market data, coin prices</td>
                        <td className="py-2">None (server-side requests only)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">RSS Source Websites</td>
                        <td className="py-2 pr-4">News content aggregation</td>
                        <td className="py-2">None (server-side fetching); clicking links directs you to their sites</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4">
                  When you click on an article link, you are redirected to the
                  original publisher&apos;s website. That site is governed by its
                  own privacy policy, and we encourage you to review it.
                </p>
              </section>

              {/* 5. Data Retention */}
              <section className="mb-10">
                <SectionHeading id="data-retention" number={5} title="Data Retention" />
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Server Logs:</strong> Automatically purged by Vercel
                    within 30 days.
                  </li>
                  <li>
                    <strong>Analytics Data:</strong> Retained in aggregated,
                    anonymized form by Vercel. No individual-level data is
                    stored.
                  </li>
                  <li>
                    <strong>News Cache:</strong> Aggregated news article metadata
                    (headlines, links, timestamps) is cached temporarily and
                    refreshed on a regular schedule. Historical archive data is
                    retained indefinitely as part of the public record.
                  </li>
                  <li>
                    <strong>Local Storage:</strong> Preferences stored in your
                    browser persist until you clear your browser data.
                  </li>
                </ul>
              </section>

              {/* 6. Your Rights */}
              <section className="mb-10">
                <SectionHeading id="your-rights" number={6} title="Your Rights" />
                <p>
                  Because we collect minimal data and do not maintain user
                  accounts, many privacy rights are satisfied by design. However,
                  depending on your jurisdiction, you may have the following
                  rights:
                </p>
                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Under GDPR (European Economic Area)
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Right of Access:</strong> Request what data we hold about you (in most cases, none).</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate data.</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of any data we may hold.</li>
                  <li><strong>Right to Restriction:</strong> Request we limit processing of your data.</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format.</li>
                  <li><strong>Right to Object:</strong> Object to data processing based on legitimate interests.</li>
                </ul>
                <h3 className="font-serif text-lg font-semibold mt-6 mb-2">
                  Under CCPA (California)
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Right to Know:</strong> Request disclosure of what personal information we collect.</li>
                  <li><strong>Right to Delete:</strong> Request deletion of personal information.</li>
                  <li><strong>Right to Opt-Out:</strong> We do not sell personal information, so this right is satisfied by default.</li>
                  <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights.</li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, please contact us using the
                  information in Section 10 below.
                </p>
              </section>

              {/* 7. API Usage Data */}
              <section className="mb-10">
                <SectionHeading id="api-usage-data" number={7} title="API Usage Data" />
                <p>
                  Our public API does not require authentication for basic usage.
                  When you make API requests, we may log:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>IP address of the requesting client</li>
                  <li>Timestamp of the request</li>
                  <li>Requested endpoint and query parameters</li>
                  <li>Response status code and size</li>
                  <li>User-Agent header</li>
                </ul>
                <p className="mt-4">
                  This data is used solely for rate limiting, abuse prevention,
                  and operational monitoring. It is automatically purged
                  according to the retention schedule described in Section 5.
                </p>
                <p className="mt-2">
                  If you use an API key (for higher rate limits), the key itself
                  is stored securely but is not associated with any personal
                  identity unless you voluntarily provide identifying
                  information.
                </p>
              </section>

              {/* 8. Children's Privacy */}
              <section className="mb-10">
                <SectionHeading id="childrens-privacy" number={8} title="Children's Privacy" />
                <p>
                  FCN is not directed at children under the age of 13. We do not
                  knowingly collect personal information from children under 13.
                  Since we do not collect personal information from any users, we
                  believe our service is compliant with the Children&apos;s
                  Online Privacy Protection Act (COPPA) and similar legislation.
                </p>
                <p className="mt-2">
                  If you believe a child under 13 has provided personal
                  information to us, please contact us and we will take
                  appropriate steps to remove such information.
                </p>
              </section>

              {/* 9. Changes to This Policy */}
              <section className="mb-10">
                <SectionHeading id="changes-to-policy" number={9} title="Changes to This Policy" />
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices, technology, legal requirements, or
                  other factors. When we make changes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    The &ldquo;Last updated&rdquo; date at the top of this page
                    will be revised.
                  </li>
                  <li>
                    Material changes may be announced via our GitHub repository
                    or changelog.
                  </li>
                  <li>
                    Continued use of our services after the update constitutes
                    acceptance of the revised policy.
                  </li>
                </ul>
                <p className="mt-4">
                  We encourage you to review this page periodically for the
                  latest information on our privacy practices.
                </p>
              </section>

              {/* 10. Contact Us */}
              <section className="mb-10">
                <SectionHeading id="contact-us" number={10} title="Contact Us" />
                <p>
                  If you have any questions, concerns, or requests regarding this
                  Privacy Policy, you can reach us through:
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
                    <a href="mailto:privacy@cryptocurrency.cv">
                      privacy@cryptocurrency.cv
                    </a>
                  </li>
                </ul>
                <p className="mt-4">
                  We aim to respond to all privacy-related inquiries within 30
                  days.
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