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
import SettingsPanel from "@/components/SettingsPanel";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Settings — Preferences & Configuration",
    description:
      "Customize your Crypto Vision News experience. Configure notifications, display preferences, feed settings, and more.",
    path: "/settings",
    locale,
    tags: ["settings", "preferences", "configuration"],
    noindex: true,
  });
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <SettingsPanel locale={locale} />
      <Footer />
    </>
  );
}
