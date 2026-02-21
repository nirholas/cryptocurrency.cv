import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { generateSEOMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
const AIMarketAgentDashboard = dynamic(
  () => import('@/components/AIMarketAgentDashboard').then(m => ({ default: m.AIMarketAgentDashboard })),
  { ssr: false }
);

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'AI Market Agent',
    description: 'AI-powered crypto market intelligence synthesizing news, social sentiment, on-chain data, and derivatives into actionable trading insights.',
    path: '/ai-agent',
    tags: ['ai trading', 'market intelligence', 'crypto analysis', 'trading signals', 'market sentiment'],
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AIAgentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🤖</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Market Intelligence Agent
            </h1>
            <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full">
              NEW
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            Revolutionary market analysis powered by multi-source signal synthesis
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="text-2xl mb-2">📰</div>
            <h3 className="font-bold">News Analysis</h3>
            <p className="text-sm text-blue-100">Real-time sentiment extraction from crypto news</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-bold">Social Intelligence</h3>
            <p className="text-sm text-green-100">Twitter, Reddit, and Telegram sentiment tracking</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="text-2xl mb-2">⛓️</div>
            <h3 className="font-bold">On-Chain Data</h3>
            <p className="text-sm text-purple-100">Exchange flows, whale movements, network activity</p>
          </div>
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 text-white">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-bold">Derivatives</h3>
            <p className="text-sm text-gray-300">Funding rates, open interest, liquidations</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⚡</span> How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs">1</span>
                Data Aggregation
              </div>
              <p className="text-gray-600 dark:text-slate-300">
                Continuously ingests data from 50+ sources: news feeds, social platforms, 
                blockchain explorers, and exchange APIs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs">2</span>
                Signal Detection
              </div>
              <p className="text-gray-600 dark:text-slate-300">
                AI algorithms identify significant patterns: sentiment shifts, whale movements, 
                funding extremes, correlation breaks, and regime changes.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs">3</span>
                Actionable Insights
              </div>
              <p className="text-gray-600 dark:text-slate-300">
                Synthesizes signals into trading opportunities with entry, target, and stop levels, 
                plus risk alerts and market narratives.
              </p>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <AIMarketAgentDashboard />

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Disclaimer:</strong> This AI agent provides informational analysis only and should not 
            be considered financial advice. Always conduct your own research and consider your risk tolerance 
            before making any trading decisions. Past performance does not guarantee future results.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
