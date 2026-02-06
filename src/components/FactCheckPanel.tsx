'use client';

import { useState, useEffect } from 'react';

interface FactCheckClaim {
  claim: string;
  source: string;
  type: 'factual' | 'prediction' | 'opinion' | 'quote';
  confidence: 'verified' | 'likely' | 'unverified' | 'disputed';
  verificationNotes: string;
  relatedTickers: string[];
}

interface FactCheckData {
  claims: FactCheckClaim[];
  checkedAt: string;
}

interface FactCheckPanelProps {
  articleUrl: string;
  articleTitle: string;
  source: string;
}

const verdictConfig: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  verified: { color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: '✅', label: 'Verified' },
  likely: { color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '🟡', label: 'Likely' },
  unverified: { color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50', icon: '❓', label: 'Unverified' },
  disputed: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: '❌', label: 'Disputed' },
};

const typeIcons: Record<string, string> = {
  factual: '📊',
  prediction: '🔮',
  opinion: '💭',
  quote: '💬',
};

function computeOverallScore(claims: FactCheckClaim[]): number {
  if (claims.length === 0) return 0;
  const weights: Record<string, number> = { verified: 100, likely: 70, unverified: 40, disputed: 10 };
  const total = claims.reduce((sum, c) => sum + (weights[c.confidence] || 40), 0);
  return Math.round(total / claims.length);
}

export function FactCheckPanel({ articleUrl, articleTitle, source }: FactCheckPanelProps) {
  const [data, setData] = useState<FactCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClaims, setExpandedClaims] = useState<Set<number>>(new Set());

  const fetchFactCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: articleTitle, limit: '5' });
      const response = await fetch(`/api/factcheck?${params}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      setData({
        claims: result.claims || [],
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fact-check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactCheck();
  }, [articleUrl]);

  const toggleClaim = (index: number) => {
    setExpandedClaims(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="ml-auto h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Fact Check</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
          <span>⚠️</span>
          <div className="flex-1">
            <div className="font-medium">Could not load fact check</div>
            <div className="text-sm opacity-75">{error}</div>
          </div>
          <button
            onClick={fetchFactCheck}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.claims.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Fact Check</h2>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">No verifiable claims found in this article.</p>
      </div>
    );
  }

  const overallScore = computeOverallScore(data.claims);
  const scoreColor = overallScore >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    : overallScore >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Fact Check</h2>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {data.claims.length} claim{data.claims.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${scoreColor}`}>
            {overallScore}/100
          </span>
        </div>
      </div>

      {/* Claims */}
      <div className="px-6 pb-4 space-y-3">
        {data.claims.map((claim, index) => {
          const verdict = verdictConfig[claim.confidence] || verdictConfig.unverified;
          const isExpanded = expandedClaims.has(index);

          return (
            <div
              key={index}
              className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleClaim(index)}
                className="w-full p-4 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              >
                <span className={`mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${verdict.bgColor} ${verdict.color}`}>
                  {verdict.icon} {verdict.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {claim.claim}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {typeIcons[claim.type] || '📋'} {claim.type}
                    </span>
                    {claim.relatedTickers.length > 0 && (
                      <div className="flex gap-1">
                        {claim.relatedTickers.slice(0, 3).map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                            ${t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                      Verification Notes
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                      {claim.verificationNotes}
                    </p>
                  </div>
                  {claim.source && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      Source: {claim.source}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-slate-400">
          🤖 Powered by AI · {new Date(data.checkedAt).toLocaleTimeString()}
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          Source: {source}
        </span>
      </div>
    </div>
  );
}
