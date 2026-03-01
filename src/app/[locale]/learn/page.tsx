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
    title: "Learn Crypto — Free Crypto News",
    description:
      "Learn the basics of cryptocurrency, blockchain, Bitcoin, Ethereum, DeFi, and Web3. Beginner-friendly guides and educational content.",
    path: "/learn",
    locale,
    tags: ["learn crypto", "crypto basics", "blockchain education", "bitcoin guide", "defi explained"],
  });
}

const topics = [
  {
    title: "What is Cryptocurrency?",
    description:
      "Cryptocurrency is digital money secured by cryptography and powered by blockchain technology. Unlike traditional currencies, crypto operates without a central authority like a bank or government.",
  },
  {
    title: "What is Bitcoin?",
    description:
      "Bitcoin (BTC) is the first and largest cryptocurrency, created in 2009 by the pseudonymous Satoshi Nakamoto. It introduced the concept of a decentralized peer-to-peer electronic cash system with a fixed supply of 21 million coins.",
  },
  {
    title: "What is Ethereum?",
    description:
      "Ethereum (ETH) is a programmable blockchain that enables smart contracts and decentralized applications (dApps). It powers DeFi protocols, NFT marketplaces, Layer 2 networks, and much of the Web3 ecosystem.",
  },
  {
    title: "What is DeFi?",
    description:
      "Decentralized Finance (DeFi) refers to financial services built on blockchain — lending, borrowing, trading, and earning yield without traditional intermediaries. Popular protocols include Aave, Uniswap, and MakerDAO.",
  },
  {
    title: "What is a Wallet?",
    description:
      "A crypto wallet stores your private keys and lets you send, receive, and manage your digital assets. Wallets can be software-based (MetaMask, Phantom) or hardware devices (Ledger, Trezor) for added security.",
  },
  {
    title: "What are NFTs?",
    description:
      "Non-Fungible Tokens (NFTs) are unique digital assets on the blockchain representing ownership of art, collectibles, music, or other media. Each NFT is one-of-a-kind and cannot be replicated.",
  },
  {
    title: "What is Staking?",
    description:
      "Staking involves locking your crypto to help secure a proof-of-stake blockchain network. In return, stakers earn rewards — similar to earning interest. Ethereum, Solana, and Cosmos all use staking.",
  },
  {
    title: "Staying Safe in Crypto",
    description:
      "Protect yourself by using hardware wallets for large holdings, enabling two-factor authentication, never sharing your seed phrase, and verifying URLs before connecting your wallet. If something seems too good to be true, it probably is.",
  },
];

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          Learn Crypto
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-10 max-w-2xl">
          New to cryptocurrency? Start here. These guides cover the fundamentals
          of blockchain, digital assets, and decentralized finance.
        </p>

        <div className="space-y-8 max-w-3xl">
          {topics.map((topic) => (
            <section key={topic.title}>
              <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
                {topic.title}
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {topic.description}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] max-w-3xl">
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
