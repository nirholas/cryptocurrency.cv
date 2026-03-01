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
    title: "Privacy Policy — Free Crypto News",
    description:
      "Privacy policy for Free Crypto News. Learn how we handle your data — spoiler: we collect almost nothing.",
    path: "/privacy",
    locale,
    tags: ["privacy policy", "data protection", "GDPR"],
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-[var(--color-text-primary)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
          Last updated: March 1, 2026
        </p>

        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Overview
            </h2>
            <p>
              Free Crypto News (&ldquo;FCN&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to
              protecting your privacy. This policy explains what data we collect
              (very little) and how we use it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Data We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No personal data:</strong> We do not require accounts,
                API keys, or any form of registration.
              </li>
              <li>
                <strong>Server logs:</strong> Standard web server logs (IP
                address, user agent, request path) may be collected for
                operational purposes and are automatically purged.
              </li>
              <li>
                <strong>Analytics:</strong> We may use privacy-respecting
                analytics (e.g., Plausible or Vercel Analytics) that do not use
                cookies or track individuals.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Cookies
            </h2>
            <p>
              FCN does not use tracking cookies. We may use essential cookies for
              locale preferences, which contain no personal information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Third-Party Services
            </h2>
            <p>
              News content is aggregated from third-party RSS feeds. When you
              click an article link, you are directed to the original publisher's
              website, which is governed by their own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Data Retention
            </h2>
            <p>
              Server logs are retained for no more than 30 days. Aggregated news
              data is cached temporarily and refreshed regularly.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              Contact
            </h2>
            <p>
              If you have questions about this policy, please open an issue on our{" "}
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
