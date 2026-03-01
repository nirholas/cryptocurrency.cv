import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { getDefiNews, type NewsResponse } from "@/lib/crypto-news";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DefiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let data: NewsResponse | null = null;
  try {
    data = await getDefiNews(30);
  } catch {
    // Render empty state on failure
  }

  const articles = data?.articles ?? [];

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          🏦 DeFi News
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
          Decentralized finance news — yield farming, DEXs, lending protocols,
          TVL updates, and more.
        </p>

        {articles.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] py-12 text-center">
            No DeFi articles available right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.link} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
