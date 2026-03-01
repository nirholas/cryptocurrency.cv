import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import { learnArticles } from "@/data/learn-articles";
import Glossary from "@/components/Glossary";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Learn Crypto — Crypto Vision News",
    description:
      "Learn the basics of cryptocurrency, blockchain, Bitcoin, Ethereum, DeFi, and Web3. Beginner-friendly guides and educational content.",
    path: "/learn",
    locale,
    tags: [
      "learn crypto",
      "crypto basics",
      "blockchain education",
      "bitcoin guide",
      "defi explained",
    ],
  });
}

const resources = [
  {
    title: "Bitcoin Whitepaper",
    url: "https://bitcoin.org/bitcoin.pdf",
    description: "Satoshi Nakamoto's original 2008 paper that started it all.",
  },
  {
    title: "Ethereum.org Learn Hub",
    url: "https://ethereum.org/en/learn/",
    description: "Official educational resources from the Ethereum Foundation.",
  },
  {
    title: "DeFi Llama",
    url: "https://defillama.com",
    description:
      "Track DeFi protocols, TVL, and yields across all chains.",
  },
  {
    title: "The Bankless Podcast",
    url: "https://www.bankless.com",
    description: "Leading crypto podcast covering DeFi, Ethereum, and Web3.",
  },
  {
    title: "Andreas Antonopoulos — Mastering Bitcoin",
    url: "https://github.com/bitcoinbook/bitcoinbook",
    description:
      "The definitive technical book on Bitcoin, free and open source.",
  },
  {
    title: "Unchained Podcast",
    url: "https://unchainedcrypto.com",
    description:
      "In-depth interviews with the biggest names in crypto and blockchain.",
  },
];

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text-primary)]">
            Learn Crypto
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-2xl text-lg leading-relaxed">
            New to cryptocurrency? Start here. Our beginner-friendly guides,
            searchable glossary, and curated resources will help you understand
            blockchain, digital assets, and decentralized finance.
          </p>
        </section>

        {/* Beginner Guides Grid */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-6 text-[var(--color-text-primary)]">
            Beginner Guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learnArticles.map((article) => (
              <Link key={article.slug} href={`/learn/${article.slug}`}>
                <Card className="h-full flex flex-col hover:border-[var(--color-accent)] transition-colors">
                  <CardHeader>
                    <span className="text-3xl mb-2 block">{article.icon}</span>
                    <CardTitle>{article.title}</CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <div className="flex items-center justify-between w-full">
                      <Badge>{article.difficulty}</Badge>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {article.readTime}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Glossary Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-2 text-[var(--color-text-primary)]">
            Crypto Glossary
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            A searchable A–Z reference of essential cryptocurrency terms and
            definitions.
          </p>
          <Glossary />
        </section>

        {/* Resources Section */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold mb-6 text-[var(--color-text-primary)]">
            Resources
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Handpicked books, podcasts, and tools for going deeper.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <a
                key={r.title}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full hover:border-[var(--color-accent)] transition-colors">
                  <CardHeader>
                    <CardTitle className="group-hover:text-[var(--color-accent)] transition-colors">
                      {r.title}
                      <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        ↗
                      </span>
                    </CardTitle>
                    <CardDescription>{r.description}</CardDescription>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-8 border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] mb-4">
            Ready to explore?
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/"
              className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Read the Latest News
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
            >
              Read the Blog
            </Link>
            <Link
              href="/developers"
              className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
            >
              Explore the API
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
