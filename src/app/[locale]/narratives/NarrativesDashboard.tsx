'use client';

import { useState, useEffect } from 'react';

interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  articleCount: number;
  tickers: string[];
  keywords: string[];
  isEmerging: boolean;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
}

export default function NarrativesDashboard() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmerging, setShowEmerging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = showEmerging ? '?emerging=true' : '';
        const res = await fetch(`/api/narratives${params}`);
        if (res.ok) {
          const json = await res.json();
          setNarratives(json.narratives || []);
        }
      } catch (err) {
        console.error('Failed to fetch narratives:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showEmerging]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400 bg-green-400/10';
      case 'bearish':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowEmerging(false)}
          className={`px-4 py-2 rounded-lg ${
            !showEmerging
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Narratives
        </button>
        <button
          onClick={() => setShowEmerging(true)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            showEmerging
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <span className="text-yellow-400">✨</span>
          Emerging Only
        </button>
      </div>

      {/* Narratives Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {narratives.map((narrative) => (
          <div
            key={narrative.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{narrative.name}</h3>
                {narrative.isEmerging && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getSentimentColor(
                  narrative.sentiment
                )}`}
              >
                {narrative.sentiment}
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-4">{narrative.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Strength</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${narrative.strength}%` }}
                    />
                  </div>
                  <span className="text-white">{narrative.strength}%</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Articles</span>
                <div className="text-white font-medium">{narrative.articleCount}</div>
              </div>
            </div>

            {/* Related Tickers */}
            <div className="flex flex-wrap gap-1 mb-3">
              {narrative.tickers.slice(0, 8).map((ticker) => (
                <span
                  key={ticker}
                  className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium"
                >
                  ${ticker}
                </span>
              ))}
            </div>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1">
              {narrative.keywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
              <span>First seen: {new Date(narrative.firstSeen).toLocaleDateString()}</span>
              <span>{narrative.sources.length} sources</span>
            </div>
          </div>
        ))}
      </div>

      {narratives.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No narratives found. Check back later.
        </div>
      )}
    </div>
  );
}
