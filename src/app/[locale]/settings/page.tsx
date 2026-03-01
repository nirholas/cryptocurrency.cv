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
      "Customize your Free Crypto News experience. Configure notifications, display preferences, feed settings, and more.",
    path: "/settings",
    locale,
    tags: ["settings", "preferences", "configuration"],
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
