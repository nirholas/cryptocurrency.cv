/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Widget Builder Page
 *
 * Interactive configurator for creating embeddable crypto widgets.
 * Offers live preview and embed code generation.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WidgetBuilder from "@/components/WidgetBuilder";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Widget Builder — Crypto Vision News",
    description:
      "Create embeddable cryptocurrency widgets for your website. Price tickers, news feeds, coin cards, market overviews, and Fear & Greed gauges — all free, no API key required.",
    path: "/widgets",
    locale,
    tags: [
      "crypto widget",
      "embed crypto prices",
      "bitcoin widget",
      "crypto news widget",
      "embeddable widget",
      "free crypto widget",
    ],
  });
}

export const revalidate = 3600;

export default async function WidgetsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="container-main">
        <WidgetBuilder />
      </main>
      <Footer />
    </>
  );
}
