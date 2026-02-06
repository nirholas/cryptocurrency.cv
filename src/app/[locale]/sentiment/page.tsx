import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Sentiment - Free Crypto News',
  description: 'AI-powered crypto market sentiment analysis. Understand the mood of the market.',
};

// Force dynamic rendering to avoid self-referential API call during build
export const dynamic = 'force-dynamic';

interface SentimentArticle {
  title: string;
  source: string;
  sentiment: string;
  confidence: number;
  reasoning: string;
  impactLevel: string;
  affectedAssets: string[];
}

interface MarketSentiment {
  overall: string;
  score: number;
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

interface SentimentData {
  articles: SentimentArticle[];
  market: MarketSentiment;
}

async function getSentiment(): Promise<SentimentData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv'}/api/sentiment?limit=20`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const sentimentColors: Record<string, { text: string; bg: string; border: string }> = {
  very_bullish: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
  bullish: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  neutral: { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
  bearish: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  very_bearish: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

const sentimentEmojis: Record<string, string> = {
  very_bullish: '🚀',
  bullish: '📈',
  neutral: '➡️',
  bearish: '📉',
  very_bearish: '💥',
};

function SentimentGauge({ score }: { score: number }) {
  // Score is -100 to 100, normalize to 0-100 for display
  const normalized = (score + 100) / 2;
  const rotation = (normalized / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Gauge background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-48 h-48 rounded-full border-[16px] border-gray-200" 
             style={{ 
               borderTopColor: '#ef4444', 
               borderRightColor: '#eab308', 
               borderBottomColor: 'transparent',
               borderLeftColor: '#22c55e',
               transform: 'rotate(-45deg)'
             }} 
        />
      </div>
      {/* Needle */}
      <div 
        className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom rounded-full transition-transform duration-500"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />
      {/* Center dot */}
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2" />
      {/* Score */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl font-bold">
        {score > 0 ? '+' : ''}{score}
      </div>
    </div>
  );
}

export default async function SentimentPage() {
  const data = await getSentiment();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">🎯 Market Sentiment</h1>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered analysis of crypto market mood
            </p>
          </div>

          {data ? (
            <div className="space-y-8">
              {/* Overall Sentiment Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="text-center">
                    <h2 className="text-lg text-gray-500 dark:text-slate-400 mb-4">Market Sentiment Score</h2>
                    <SentimentGauge score={data.market.score} />
                    <div className="mt-12">
                      <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${sentimentColors[data.market.overall]?.bg || 'bg-gray-100 dark:bg-slate-700'} ${sentimentColors[data.market.overall]?.text || 'text-gray-600 dark:text-slate-300'}`}>
                        {sentimentEmojis[data.market.overall] || '➡️'} {data.market.overall.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Summary</h3>
                    <p className="text-gray-700 dark:text-slate-300 mb-4">{data.market.summary}</p>
                    
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Key Drivers</h3>
                    <ul className="space-y-2">
                      {data.market.keyDrivers?.map((driver, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                          <span className="text-blue-500 dark:text-blue-400">→</span>
                          {driver}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">
                      Confidence: {data.market.confidence}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Sentiment List */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📰 Article Analysis</h2>
                <div className="space-y-3">
                  {data.articles?.map((article, i) => (
                    <div 
                      key={i} 
                      className={`bg-white dark:bg-slate-800 rounded-xl border p-5 ${sentimentColors[article.sentiment]?.border || 'border-gray-200 dark:border-slate-700'}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{article.source}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${sentimentColors[article.sentiment]?.bg || 'bg-gray-100 dark:bg-slate-700'} ${sentimentColors[article.sentiment]?.text || 'text-gray-600 dark:text-slate-300'}`}>
                            {sentimentEmojis[article.sentiment] || '➡️'} {article.sentiment.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${article.impactLevel === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : article.impactLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                            {article.impactLevel} impact
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{article.reasoning}</p>
                      {article.affectedAssets?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.affectedAssets.map((asset) => (
                            <Link
                              key={asset}
                              href={`/search?q=${asset}`}
                              className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            >
                              {asset}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Sentiment Analysis Unavailable</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">AI features require GROQ_API_KEY to be configured</p>
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                ← Back to latest news
              </Link>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
