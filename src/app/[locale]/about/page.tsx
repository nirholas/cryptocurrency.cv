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
    title: "About Free Crypto News",
    description:
      "Free crypto news API aggregating real-time headlines from 300+ trusted sources. No API key required. Open source and community-driven.",
    path: "/about",
    locale,
    tags: ["about", "crypto news API", "free API", "cryptocurrency news aggregator", "open source"],
  });
}

const features = [
  { icon: "🆓", title: "Completely Free", description: "No API keys, no rate limits, no hidden costs." },
  { icon: "⚡", title: "Real-time Updates", description: "News aggregated every 5 minutes from 300+ sources." },
  { icon: "🔍", title: "Smart Search", description: "Search across all sources with keyword matching." },
  { icon: "📊", title: "Market Context", description: "Live prices, fear & greed index, and market stats." },
  { icon: "🤖", title: "AI/LLM Ready", description: "ChatGPT plugin, Claude MCP server, and structured JSON." },
  { icon: "🔧", title: "Developer Friendly", description: "REST API, RSS feeds, SDKs for Python, TS, Go, PHP." },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="text-center mb-14">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-[var(--color-text-primary)]">
            About Free Crypto News
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
            The only 100% free crypto news aggregator API. No API keys required.
            No rate limits. Real-time crypto news from 300+ sources — open source
            and community-driven.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-14 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
            Our Mission
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Free Crypto News (FCN) exists to democratize access to cryptocurrency
            information. We believe everyone — developers, researchers, traders,
            and enthusiasts — deserves free, instant access to aggregated crypto
            news without barriers.
          </p>
          <p className="text-[var(--color-text-secondary)]">
            We aggregate headlines from 300+ trusted sources including CoinDesk,
            The Block, Bloomberg, Reuters, CoinTelegraph, Decrypt, and many more,
            covering Bitcoin, Ethereum, DeFi, Solana, altcoins, regulation,
            security, and every corner of the crypto ecosystem.
          </p>
        </section>

        {/* Features grid */}
        <section className="mb-14">
          <h2 className="font-serif text-2xl font-bold text-center mb-8 text-[var(--color-text-primary)]">
            Why Free Crypto News?
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6 hover:shadow-md transition"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-lg mb-1 text-[var(--color-text-primary)]">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section className="mb-14 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
            Open Source
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            FCN is open source — inspect the code, self-host your own instance,
            or contribute new features. We welcome pull requests, translations,
            and community feedback.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="https://github.com/nirholas/free-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
            >
              ⭐ Star on GitHub
            </a>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              API Docs →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
