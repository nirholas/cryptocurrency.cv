import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import DataExporter from "@/components/DataExporter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Data Export & RSS Feeds — Download Crypto Data",
    description:
      "Export cryptocurrency news, prices, and market data in JSON, CSV, or XML. Configure RSS and Atom feeds for your reader. Free, no API key required.",
    path: "/export",
    locale,
    tags: [
      "data export",
      "CSV download",
      "JSON API",
      "RSS feed",
      "Atom feed",
      "crypto data",
      "market data",
      "OPML",
    ],
  });
}

export default async function ExportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Data Export &amp; Feeds
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)] max-w-2xl">
            Download crypto data in multiple formats or subscribe to real-time
            RSS and Atom feeds. All exports are free — no API key required.
          </p>
        </div>

        <DataExporter />
      </main>
      <Footer />
    </>
  );
}
