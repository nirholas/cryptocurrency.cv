'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useState } from 'react';

interface DebateResult {
  topic: string;
  bullCase: {
    thesis: string;
    arguments: string[];
    supportingEvidence: string[];
    priceTarget?: string;
    timeframe?: string;
    confidence: number;
  };
  bearCase: {
    thesis: string;
    arguments: string[];
    supportingEvidence: string[];
    priceTarget?: string;
    timeframe?: string;
    confidence: number;
  };
  neutralAnalysis: {
    keyUncertainties: string[];
    whatToWatch: string[];
    consensus?: string;
  };
  generatedAt: string;
}

const popularTopics = [
  'Bitcoin hitting $200k in 2026',
  'Ethereum vs Solana for DeFi',
  'Is the altcoin season coming?',
  'Will CBDCs kill crypto?',
  'AI tokens - bubble or revolution?',
  'Is DeFi dead or just resting?',
];

export default function DebatePage() {
  const [topic, setTopic] = useState('');
  const [debate, setDebate] = useState<DebateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDebate(debateTopic: string) {
    if (!debateTopic.trim()) return;
    
    setLoading(true);
    setError(null);
    setDebate(null);

    try {
      const res = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: debateTopic }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to generate debate');
      }

      const data = await res.json();
      if (data.success) {
        setDebate(data.debate);
      } else {
        throw new Error(data.message || 'Failed to generate debate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">🎭 The Debate</h1>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered bull vs bear analysis on any crypto topic
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/ai/brief" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                📊 The Brief →
              </Link>
              <Link href="/ai/counter" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                ⚖️ The Counter →
              </Link>
            </div>
          </div>

          {/* Topic Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Enter a topic to debate
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateDebate(topic)}
                placeholder="e.g., Will Bitcoin reach $200k in 2026?"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => generateDebate(topic)}
                disabled={loading || !topic.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Generating...' : 'Debate 🎭'}
              </button>
            </div>

            {/* Popular Topics */}
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-slate-400">Popular topics:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {popularTopics.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTopic(t);
                      generateDebate(t);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4 animate-pulse">🎭</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Generating Debate...</h3>
              <p className="text-gray-500 dark:text-slate-400">Our AI is analyzing both sides</p>
            </div>
          )}

          {/* Debate Results */}
          {debate && !loading && (
            <div className="space-y-6">
              {/* Topic Banner */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
                <h2 className="text-2xl font-bold">{debate.topic}</h2>
              </div>

              {/* Bull vs Bear */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bull Case */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">🐂</span>
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Bull Case</h3>
                    <span className="ml-auto px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-sm font-medium">
                      {debate.bullCase.confidence}% confident
                    </span>
                  </div>
                  
                  <p className="text-green-800 dark:text-green-300 font-medium mb-4">{debate.bullCase.thesis}</p>
                  
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Arguments:</h4>
                  <ul className="space-y-2 mb-4">
                    {debate.bullCase.arguments.map((arg, i) => (
                      <li key={i} className="flex items-start gap-2 text-green-700 dark:text-green-300">
                        <span className="text-green-500">✓</span>
                        <span>{arg}</span>
                      </li>
                    ))}
                  </ul>

                  {debate.bullCase.priceTarget && (
                    <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                      <span className="text-sm text-green-600 dark:text-green-400">Price Target: </span>
                      <span className="font-bold text-green-800 dark:text-green-200">{debate.bullCase.priceTarget}</span>
                      {debate.bullCase.timeframe && (
                        <span className="text-sm text-green-600 dark:text-green-400"> ({debate.bullCase.timeframe})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bear Case */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">🐻</span>
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Bear Case</h3>
                    <span className="ml-auto px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-sm font-medium">
                      {debate.bearCase.confidence}% confident
                    </span>
                  </div>
                  
                  <p className="text-red-800 dark:text-red-300 font-medium mb-4">{debate.bearCase.thesis}</p>
                  
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Arguments:</h4>
                  <ul className="space-y-2 mb-4">
                    {debate.bearCase.arguments.map((arg, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-700 dark:text-red-300">
                        <span className="text-red-500">✗</span>
                        <span>{arg}</span>
                      </li>
                    ))}
                  </ul>

                  {debate.bearCase.priceTarget && (
                    <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-lg">
                      <span className="text-sm text-red-600 dark:text-red-400">Price Target: </span>
                      <span className="font-bold text-red-800 dark:text-red-200">{debate.bearCase.priceTarget}</span>
                      {debate.bearCase.timeframe && (
                        <span className="text-sm text-red-600 dark:text-red-400"> ({debate.bearCase.timeframe})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Neutral Analysis */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⚖️</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Neutral Analysis</h3>
                </div>

                {debate.neutralAnalysis.consensus && (
                  <p className="text-gray-700 dark:text-slate-300 mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <span className="font-semibold">Consensus: </span>
                    {debate.neutralAnalysis.consensus}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">🤔 Key Uncertainties</h4>
                    <ul className="space-y-2">
                      {debate.neutralAnalysis.keyUncertainties.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">👀 What to Watch</h4>
                    <ul className="space-y-2">
                      {debate.neutralAnalysis.whatToWatch.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                Generated at {new Date(debate.generatedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!debate && !loading && !error && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Enter a Topic</h3>
              <p className="text-gray-500 dark:text-slate-400">
                Get AI-generated bull and bear perspectives on any crypto topic
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
