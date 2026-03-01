import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import DevelopersContent from "./DevelopersContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Developers — Crypto Vision News API Documentation",
    description:
      "Complete API documentation for Crypto Vision News. REST endpoints for news, markets, DeFi, blockchain data, social sentiment, and RSS feeds. No API key required. SDKs for Python, TypeScript, Go, React, and PHP.",
    path: "/developers",
    locale,
    tags: [
      "API docs",
      "developer",
      "REST API",
      "crypto news API",
      "endpoints",
      "SDK",
      "Python",
      "TypeScript",
      "Go",
      "React",
      "PHP",
    ],
  });
}

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <DevelopersContent />
      <Footer />
    </>
  );
}
