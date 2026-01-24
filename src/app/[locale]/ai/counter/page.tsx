'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useState } from 'react';

interface CounterResult {
  originalClaim: string;
  counterArguments: {
    argument: string;
    type: 'factual' | 'logical' | 'contextual' | 'alternative';
    strength: 'strong' | 'moderate' | 'weak';
    source?: string;
  }[];
  assumptions: {
    assumption: string;
    challenge: string;
  }[];
  alternativeInterpretations: string[];
  missingContext: string[];
  overallAssessment: {
    claimStrength: 'strong' | 'moderate' | 'weak';
    mainVulnerability: string;
  };
  generatedAt: string;
}

const exampleClaims = [
  'Bitcoin will replace gold as the primary store of value',
  'Ethereum will flip Bitcoin by market cap',
  'NFTs are completely worthless',
  'DeFi is safer than traditional banking',
  'Crypto regulations will kill innovation',
  'Proof of Stake is more secure than Proof of Work',
];

const typeConfig = {
  factual: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '📊' },
  logical: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '🧠' },
  contextual: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🔍' },
  alternative: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '💡' },
};

const strengthConfig = {
  strong: { color: 'text-green-600 dark:text-green-400', label: 'Strong' },
  moderate: { color: 'text-yellow-600 dark:text-yellow-400', label: 'Moderate' },
  weak: { color: 'text-red-600 dark:text-red-400', label: 'Weak' },
};

export default function CounterPage() {
  const [claim, setClaim] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<CounterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateCounter(inputClaim: string) {
    if (!inputClaim.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: inputClaim, context: context.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to generate counter-arguments');
      }

      const data = await res.json();
      if (data.success) {
        setResult(data.counter);
      } else {
        throw new Error(data.message || 'Failed to generate counter-arguments');
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
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">⚖️ The Counter</h1>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered fact-checking and counter-argument generation
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/ai/brief" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                📊 The Brief →
              </Link>
              <Link href="/ai/debate" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                🎭 The Debate →
              </Link>
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Enter a claim to challenge
              </label>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g., Bitcoin will reach $1 million by 2030"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Additional context (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add any relevant context, source, or background information..."
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={() => generateCounter(claim)}
              disabled={loading || !claim.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Analyzing...' : 'Challenge This Claim ⚖️'}
            </button>

            {/* Example Claims */}
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-slate-400">Try these claims:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {exampleClaims.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setClaim(c);
                      generateCounter(c);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {c.length > 40 ? c.substring(0, 40) + '...' : c}
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
              <div className="text-6xl mb-4 animate-pulse">⚖️</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Analyzing Claim...</h3>
              <p className="text-gray-500 dark:text-slate-400">Our AI is finding counter-arguments</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Original Claim */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📝</span>
                  <span className="text-sm opacity-80">Original Claim</span>
                </div>
                <p className="text-xl font-medium">&ldquo;{result.originalClaim}&rdquo;</p>
              </div>

              {/* Overall Assessment */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Assessment</h3>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-gray-500 dark:text-slate-400">Claim Strength:</span>
                  <span className={`font-bold ${strengthConfig[result.overallAssessment.claimStrength].color}`}>
                    {strengthConfig[result.overallAssessment.claimStrength].label}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold">Main Vulnerability: </span>
                  {result.overallAssessment.mainVulnerability}
                </p>
              </div>

              {/* Counter Arguments */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚔️ Counter Arguments</h3>
                <div className="space-y-4">
                  {result.counterArguments.map((arg, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[arg.type].color}`}>
                          {typeConfig[arg.type].icon} {arg.type.charAt(0).toUpperCase() + arg.type.slice(1)}
                        </span>
                        <span className={`text-sm ${strengthConfig[arg.strength].color}`}>
                          {strengthConfig[arg.strength].label}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-slate-200">{arg.argument}</p>
                      {arg.source && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                          📎 Source: {arg.source}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Assumptions */}
              {result.assumptions?.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-4">🤔 Hidden Assumptions</h3>
                  <div className="space-y-4">
                    {result.assumptions.map((item, i) => (
                      <div key={i} className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          Assumption: {item.assumption}
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                          Challenge: {item.challenge}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Interpretations */}
              {result.alternativeInterpretations?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💡 Alternative Interpretations</h3>
                  <ul className="space-y-2">
                    {result.alternativeInterpretations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-blue-500">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Context */}
              {result.missingContext?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">❓ Missing Context</h3>
                  <ul className="space-y-2">
                    {result.missingContext.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-orange-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                Generated at {new Date(result.generatedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">⚖️</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Enter a Claim</h3>
              <p className="text-gray-500 dark:text-slate-400">
                Get AI-powered counter-arguments and fact-checking for any crypto claim
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
