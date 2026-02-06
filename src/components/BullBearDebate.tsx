'use client';

import { useState } from 'react';

interface DebateCase {
  thesis: string;
  arguments: string[];
  supportingEvidence: string[];
  priceTarget?: string;
  timeframe?: string;
  confidence: number;
}

interface DebateData {
  topic: string;
  bullCase: DebateCase;
  bearCase: DebateCase;
  neutralAnalysis: {
    keyUncertainties: string[];
    whatToWatch: string[];
    consensus?: string;
  };
  generatedAt: string;
}

interface BullBearDebateProps {
  topic: string;
  articleContent?: string;
}

function ConfidenceMeter({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-slate-400 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

export function BullBearDebate({ topic, articleContent }: BullBearDebateProps) {
  const [data, setData] = useState<DebateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDebate = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { topic };
      if (articleContent) {
        body.article = { title: topic, content: articleContent };
      }
      const response = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      setData(result.debate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate debate');
    } finally {
      setLoading(false);
    }
  };

  // Initial state — show generate button
  if (!data && !loading && !error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚔️</span>
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Bull vs Bear Debate</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">AI-generated arguments for both sides</p>
          </div>
        </div>
        <button
          onClick={generateDebate}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          🐂 Generate Debate 🐻
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">⚔️</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Bull vs Bear Debate</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-slate-600 border-t-white rounded-full animate-spin" />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 animate-pulse">
              AI is analyzing both sides...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚔️</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Bull vs Bear Debate</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
          <span>⚠️</span>
          <div className="flex-1">
            <div className="font-medium">Failed to generate debate</div>
            <div className="text-sm opacity-75">{error}</div>
          </div>
          <button
            onClick={generateDebate}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Bull vs Bear Debate</h2>
          </div>
          <button
            onClick={generateDebate}
            className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-600 dark:text-slate-400 transition-colors"
          >
            ↻ Regenerate
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 line-clamp-1">{data.topic}</p>
      </div>

      {/* Bull vs Bear Split */}
      <div className="grid md:grid-cols-2 gap-0">
        {/* Bull Case */}
        <div className="p-5 border-t border-r-0 md:border-r border-gray-100 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🐂</span>
            <h3 className="font-bold text-green-700 dark:text-green-400">Bull Case</h3>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">
            {data.bullCase.thesis}
          </p>

          <div className="space-y-2 mb-4">
            {data.bullCase.arguments.map((arg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 font-bold text-xs">▲</span>
                <span className="text-sm text-gray-700 dark:text-slate-300">{arg}</span>
              </div>
            ))}
          </div>

          {data.bullCase.priceTarget && (
            <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg inline-block mb-3">
              🎯 Target: {data.bullCase.priceTarget}
              {data.bullCase.timeframe && ` (${data.bullCase.timeframe})`}
            </div>
          )}

          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Confidence</span>
            <ConfidenceMeter value={data.bullCase.confidence} color="bg-green-500" />
          </div>
        </div>

        {/* Bear Case */}
        <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🐻</span>
            <h3 className="font-bold text-red-700 dark:text-red-400">Bear Case</h3>
          </div>

          <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">
            {data.bearCase.thesis}
          </p>

          <div className="space-y-2 mb-4">
            {data.bearCase.arguments.map((arg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 font-bold text-xs">▼</span>
                <span className="text-sm text-gray-700 dark:text-slate-300">{arg}</span>
              </div>
            ))}
          </div>

          {data.bearCase.priceTarget && (
            <div className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg inline-block mb-3">
              🎯 Target: {data.bearCase.priceTarget}
              {data.bearCase.timeframe && ` (${data.bearCase.timeframe})`}
            </div>
          )}

          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Confidence</span>
            <ConfidenceMeter value={data.bearCase.confidence} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Neutral Analysis / Verdict */}
      <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚖️</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Verdict</h3>
        </div>

        {data.neutralAnalysis.consensus && (
          <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">
            {data.neutralAnalysis.consensus}
          </p>
        )}

        {data.neutralAnalysis.keyUncertainties.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Key Uncertainties</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.neutralAnalysis.keyUncertainties.map((u, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 rounded-lg">
                  {u}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.neutralAnalysis.whatToWatch.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">What to Watch</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.neutralAnalysis.whatToWatch.map((w, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
                  👀 {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <span className="text-xs text-gray-500 dark:text-slate-400">
          🤖 AI-generated debate · {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : 'Just now'}
        </span>
      </div>
    </div>
  );
}
