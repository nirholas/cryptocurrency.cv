import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ReaderContent } from '@/components/ReaderContent';
import { BreadcrumbStructuredData, NewsListStructuredData } from '@/components/StructuredData';
import { getLatestNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Reader - Free Crypto News',
  description: 'Read full crypto news articles from 130+ sources with AI-powered summaries and analysis.',
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function ReaderPage() {
  const data = await getLatestNews(50);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Structured Data for SEO */}
      <BreadcrumbStructuredData 
        items={[
          { name: 'Home', url: 'https://cryptocurrency.cv' },
          { name: 'Reader', url: 'https://cryptocurrency.cv/read' }
        ]}
      />
      <NewsListStructuredData 
        articles={data.articles.slice(0, 20)}
        listName="Latest Crypto News - Full Reader"
      />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main id="main-content" className="px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">📖 Full Article Reader</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
