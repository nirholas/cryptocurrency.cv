import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Terms of Service — Free Crypto News",
    description:
      "Terms of service for Free Crypto News. Usage guidelines for our free crypto news API and website.",
    path: "/terms",
    locale,
    tags: ["terms of service", "usage policy", "legal"],
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-[var(--color-text-primary)]">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
          Last updated: March 1, 2026
        </p>

        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Free Crypto News (&ldquo;FCN&rdquo;), including our
              website, API, RSS feeds, and any associated services, you agree to
              be bound by these terms. If you do not agree, please do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              2. Service Description
            </h2>
            <p>
              FCN is a free, open-source crypto news aggregator. We collect and
              redistribute headlines and metadata from publicly available RSS
              feeds. We do not produce original news content.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              3. Acceptable Use
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Do not use the service for any unlawful purpose.</li>
              <li>Do not attempt to disrupt, overload, or abuse the service.</li>
              <li>
                Do not scrape or redistribute content in a way that violates
                original publishers&apos; terms.
              </li>
              <li>
                Automated access via the API is encouraged — that&apos;s what it&apos;s
                for.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              4. No Warranty
            </h2>
            <p>
              FCN is provided &ldquo;as is&rdquo; without warranty of any kind, express or
              implied. We do not guarantee accuracy, completeness, or
              availability of the news content or API.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              5. Limitation of Liability
            </h2>
            <p>
              In no event shall FCN, its contributors, or maintainers be liable
              for any direct, indirect, incidental, or consequential damages
              arising from the use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              6. Intellectual Property
            </h2>
            <p>
              News content belongs to the original publishers. FCN aggregates
              publicly available RSS feed data. The FCN source code is licensed
              under the terms specified in our{" "}
              <a
                href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline hover:opacity-80"
              >
                LICENSE
              </a>{" "}
              file.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              7. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the
              service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              8. Contact
            </h2>
            <p>
              Questions about these terms? Open an issue on our{" "}
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline hover:opacity-80"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
