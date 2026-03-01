import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { generateSourcesToken } from "@/lib/sources-token";
import SourcesPageClient from "@/components/SourcesPageClient";

export const metadata = generateSEOMetadata({
  title: "News Sources",
  description:
    "Browse 300+ cryptocurrency news sources aggregated by Crypto Vision News. Covering Bitcoin, Ethereum, DeFi, NFTs, trading, and more.",
  path: "/sources",
  tags: ["crypto sources", "news sources", "bitcoin news", "crypto feeds"],
});

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Generate a short-lived HMAC token — injected into the page so the
  // client component can fetch /api/sources.  Scrapers that just curl
  // the HTML get the skeleton + an expired/missing token.
  const token = await generateSourcesToken();

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <SourcesPageClient token={token} />
      </main>
      <Footer />
    </>
  );
}
