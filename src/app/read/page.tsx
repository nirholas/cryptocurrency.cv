import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ReaderContent } from '@/components/ReaderContent';
import { getLatestNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Reader - Free Crypto News',
  description: 'Read full crypto news articles from 7 major sources with AI-powered summaries and analysis.',
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function ReaderPage() {
  const data = await getLatestNews(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">📖 Full Article Reader</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Read complete articles with AI-powered summaries and key insights.
              Click any article to expand and read the full content.
            </p>
          </div>

          <ReaderContent articles={data.articles} />
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
