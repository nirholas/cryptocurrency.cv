import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import APIPlayground from "@/components/APIPlayground";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "API Playground — Interactive Crypto Data Explorer",
    description:
      "Try any crypto news API endpoint live. Build requests, see responses in real time. No API key required. Free REST API for Bitcoin, Ethereum, DeFi and altcoin data.",
    path: "/playground",
    locale,
    tags: [
      "API playground",
      "crypto API",
      "REST API",
      "developer tools",
      "interactive docs",
      "free API",
    ],
  });
}

export default async function PlaygroundPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            API Playground
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] max-w-2xl">
            Explore and test every endpoint interactively. Build your request,
            send it, and inspect the response — no API key needed.
          </p>
        </div>

        <APIPlayground />
      </main>
      <Footer />
    </>
  );
}
