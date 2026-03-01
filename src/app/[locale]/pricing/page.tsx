import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Pricing — Free Crypto News",
    description:
      "Free Crypto News is 100% free. No API keys, no rate limits, no hidden costs. Unlimited access to real-time crypto news.",
    path: "/pricing",
    locale,
    tags: ["pricing", "free API", "crypto news API", "no rate limits"],
  });
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: true,
    features: [
      "Unlimited API requests",
      "No API key required",
      "300+ news sources",
      "Real-time aggregation",
      "RSS & Atom feeds",
      "JSON REST API",
      "Search & filtering",
      "Category endpoints",
      "Breaking & trending news",
      "Community support",
    ],
  },
  {
    name: "Self-Hosted",
    price: "$0",
    period: "your infrastructure",
    highlight: false,
    features: [
      "Everything in Free",
      "Deploy on your own servers",
      "Full source code access",
      "Custom source configuration",
      "Private instance",
      "No external dependencies",
      "Docker & Vercel support",
      "MIT-licensed",
    ],
  },
];

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <section className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text-primary)]">
            Pricing
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Free Crypto News is and always will be 100% free. No tricks, no
            paywalls, no API keys.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto mb-14">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-8 ${
                tier.highlight
                  ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              <h2 className="font-serif text-2xl font-bold mb-1 text-[var(--color-text-primary)]">
                {tier.name}
              </h2>
              <p className="mb-6">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {tier.price}
                </span>
                <span className="text-sm text-[var(--color-text-tertiary)] ml-1">
                  / {tier.period}
                </span>
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {tier.highlight ? (
                <Link
                  href="/developers"
                  className="block w-full text-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Get Started — It&apos;s Free
                </Link>
              ) : (
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
                >
                  View on GitHub
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
