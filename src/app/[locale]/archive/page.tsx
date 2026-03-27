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
import { Suspense } from "react";

import ArchiveExplorer from "@/components/ArchiveExplorer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Historical Archive Explorer",
    description:
      "Explore the full historical archive of crypto news. Browse articles by date, view market context, and search through years of Bitcoin, Ethereum, and cryptocurrency coverage.",
    path: "/archive",
    locale,
    tags: [
      "crypto archive",
      "historical news",
      "bitcoin history",
      "ethereum history",
      "crypto timeline",
      "market history",
    ],
  });
}

export default async function ArchivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <Suspense>
          <ArchiveExplorer />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
