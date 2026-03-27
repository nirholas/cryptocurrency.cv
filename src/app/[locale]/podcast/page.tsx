/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

import PodcastClient from "./PodcastClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Podcast & AI Audio News",
    description:
      "Listen to crypto news podcasts and AI-generated audio briefings covering Bitcoin, Ethereum, DeFi, and more.",
    path: "/podcast",
    locale,
    tags: ["podcast", "audio", "crypto news", "AI briefing", "bitcoin", "ethereum"],
  });
}

export default async function PodcastPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <PodcastClient />
      </main>
      <Footer />
    </>
  );
}
