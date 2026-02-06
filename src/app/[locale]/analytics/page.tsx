import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Free Crypto News',
  description: 'Advanced analytics for crypto news: headline tracking, anomaly detection, credibility scoring, and more.',
};

const analyticsFeatures = [
  {
    title: 'Headline Tracker',
    description: 'Track how article headlines change over time. Detect spin, corrections, and clickbait adjustments.',
    href: '/analytics/headlines',
    icon: '📝',
    status: 'live',
    api: '/api/analytics/headlines',
  },
  {
    title: 'Anomaly Detection',
    description: 'Detect unusual patterns in news coverage — coordinated narratives, sudden topic spikes, and more.',
    href: '/analytics/anomalies',
    icon: '🔍',
    status: 'live',
    api: '/api/analytics/anomalies',
  },
  {
    title: 'Source Credibility',
    description: 'Track source reliability scores based on accuracy, first-mover advantage, and correction rates.',
    href: '/analytics/credibility',
    icon: '⭐',
    status: 'live',
    api: '/api/analytics/credibility',
  },
  {
    title: 'Sentiment Analysis',
    description: 'Real-time market sentiment based on news coverage across all sources.',
    href: '/sentiment',
    icon: '🎯',
    status: 'live',
    api: '/api/sentiment',
  },
  {
    title: 'AI Daily Brief',
    description: 'AI-generated market intelligence with executive summary, risk alerts, and sector analysis.',
    href: '/ai/brief',
    icon: '📊',
    status: 'live',
    api: '/api/ai/brief',
  },
  {
    title: 'AI Debate',
    description: 'Get bull vs bear perspectives on any crypto topic with AI-powered analysis.',
    href: '/ai/debate',
    icon: '🎭',
    status: 'live',
    api: '/api/ai/debate',
  },
  {
    title: 'AI Counter-Arguments',
    description: 'Challenge any crypto claim with AI-generated counter-arguments and fact-checking.',
    href: '/ai/counter',
    icon: '⚖️',
    status: 'live',
    api: '/api/ai/counter',
  },
  {
    title: 'Daily Digest',
    description: 'AI-summarized daily digest of the most important crypto news.',
    href: '/digest',
    icon: '📋',
    status: 'live',
    api: '/api/digest',
  },
  {
    title: 'The Oracle',
    description: 'Natural language queries over all historical news data. Ask anything about crypto.',
    href: '/oracle',
    icon: '🔮',
    status: 'live',
    api: '/api/oracle',
  },
  {
    title: 'Prediction Tracking',
    description: 'Create and track price predictions. Compete on the leaderboard with accuracy scores.',
    href: '/predictions',
    icon: '🎱',
    status: 'live',
    api: '/api/predictions',
  },
  {
    title: 'Influencer Reliability',
    description: 'Score crypto influencers based on prediction accuracy and trading calls.',
    href: '/influencers',
    icon: '👤',
    status: 'live',
    api: '/api/social/influencer-score',
  },
  {
    title: 'Coverage Gap Analysis',
    description: 'Identify under-covered topics and emerging stories. Analyze source diversity and topic trends.',
    href: '/coverage-gap',
    icon: '🕳️',
    status: 'live',
    api: '/api/coverage-gap',
  },
];

const comingSoonFeatures: { title: string; description: string; icon: string }[] = [];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">📈 Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Advanced analytics tools for crypto news intelligence. Track headlines, detect anomalies, 
              score sources, and leverage AI-powered insights.
            </p>
          </div>

          {/* Live Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Live Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsFeatures.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{feature.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        {feature.description}
                      </p>
                      <div className="mt-3 text-xs text-gray-400 dark:text-slate-500 font-mono">
                        {feature.api}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-gray-400">🚧</span>
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comingSoonFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-100 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-slate-300">{feature.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Documentation Link */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">🛠️ Build with Our APIs</h2>
            <p className="opacity-90 mb-4">
              All analytics features are available via REST API. Free tier includes 100+ endpoints.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/developers"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Developer Portal
              </Link>
              <Link
                href="https://cryptocurrency.cv/api/docs"
                target="_blank"
                className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
              >
                API Reference
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
