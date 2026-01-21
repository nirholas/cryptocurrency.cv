import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Topics - Free Crypto News',
  description: 'See what\'s trending in crypto news right now. Real-time analysis of the hottest topics.',
};

export const revalidate = 300; // 5 minutes

interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recentHeadlines: string[];
}

async function getTrending(): Promise<{ trending: TrendingTopic[]; articlesAnalyzed: number }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://free-crypto-news.vercel.app'}/api/trending?limit=20`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return { trending: [], articlesAnalyzed: 0 };
  }
}

const sentimentConfig = {
  bullish: { emoji: '🟢', label: 'Bullish', color: 'text-green-600', bg: 'bg-green-100' },
  bearish: { emoji: '🔴', label: 'Bearish', color: 'text-red-600', bg: 'bg-red-100' },
  neutral: { emoji: '⚪', label: 'Neutral', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default async function TrendingPage() {
  const data = await getTrending();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🔥 Trending Topics</h1>
            <p className="text-gray-600">
              Real-time analysis of what&apos;s hot in crypto news • {data.articlesAnalyzed} articles analyzed
            </p>
          </div>

          {data.trending.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trending.map((topic, index) => (
                <div
                  key={topic.topic}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                      <h3 className="text-xl font-bold">{topic.topic}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentConfig[topic.sentiment].bg} ${sentimentConfig[topic.sentiment].color}`}>
                      {sentimentConfig[topic.sentiment].emoji} {sentimentConfig[topic.sentiment].label}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-3">
                    {topic.count} mentions in recent news
                  </div>

                  {topic.recentHeadlines.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-medium">Recent Headlines</p>
                      {topic.recentHeadlines.slice(0, 3).map((headline, i) => (
                        <p key={i} className="text-sm text-gray-700 line-clamp-2">
                          • {headline}
                        </p>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/search?q=${encodeURIComponent(topic.topic)}`}
                    className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                  >
                    View all {topic.topic} news →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Analyzing trends...</h3>
              <p className="text-gray-500">Check back soon for trending topics</p>
            </div>
          )}

          {/* Sentiment Legend */}
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
            <h4 className="font-medium mb-3">Understanding Sentiment</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>Bullish - Positive market sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>Bearish - Negative market sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span>Neutral - Mixed or balanced coverage</span>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
