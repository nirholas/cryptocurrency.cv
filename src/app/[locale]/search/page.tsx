import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SearchPageContent } from "@/components/SearchPageContent";
import { SearchFilters } from "@/components/SearchFilters";
import type { Metadata } from "next";
import { WebsiteStructuredData, BreadcrumbStructuredData } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Search - Free Crypto News",
  description:
    "Search crypto news from 130+ sources. Find articles about Bitcoin, Ethereum, DeFi, and more.",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    date?: string;
    sort?: string;
    category?: string;
    q?: string;
  }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { date, sort, category } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");

  void date;
  void sort;
  void category; // consumed by SearchFilters via URL params

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <WebsiteStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: 'https://cryptocurrency.cv' },
          { name: 'Search', url: 'https://cryptocurrency.cv/search' },
        ]}
      />
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
              🔍 {t("placeholder").split(",")[0]}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t("suggestions")}
            </p>
          </div>

          <Suspense fallback={null}>
            <SearchFilters />
          </Suspense>

          <SearchPageContent />
        </main>

        <Footer />
      </div>
    </div>
  );
}
