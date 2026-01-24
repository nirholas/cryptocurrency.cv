'use client';

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  asset: string;
  assetName: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: string;
  entryRange?: { low: number; high: number };
  targets?: number[];
  stopLoss?: number;
  reasoning: string;
  sources: string[];
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function SignalsDashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [minConfidence, setMinConfidence] = useState(50);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch(`/api/signals?min_confidence=${minConfidence}`);
        if (res.ok) {
          const data = await res.json();
          setSignals(data.signals || []);
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
  }, [minConfidence]);

  const filteredSignals = signals.filter(
    (s) => filter === 'all' || s.direction === filter
  );

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return 'text-green-400 bg-green-400/10';
      case 'bearish':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-yellow-400 text-sm">
          ⚠️ <strong>Educational Only:</strong> These signals are AI-generated for educational
          purposes. Not financial advice. Always do your own research.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {(['all', 'bullish', 'bearish'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Min Confidence:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-white text-sm w-12">{minConfidence}%</span>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSignals.map((signal) => (
          <div
            key={signal.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{signal.asset}</h3>
                <p className="text-gray-400 text-sm">{signal.assetName}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getDirectionColor(
                  signal.direction
                )}`}
              >
                {signal.direction}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Confidence</span>
                <div className="text-white font-medium">{signal.confidence}%</div>
              </div>
              <div>
                <span className="text-gray-500">Timeframe</span>
                <div className="text-white font-medium">{signal.timeframe}</div>
              </div>
              <div>
                <span className="text-gray-500">Risk Level</span>
                <div className={`font-medium capitalize ${getRiskColor(signal.riskLevel)}`}>
                  {signal.riskLevel}
                </div>
              </div>
              {signal.targets && signal.targets.length > 0 && (
                <div>
                  <span className="text-gray-500">Target</span>
                  <div className="text-white font-medium">
                    ${signal.targets[0].toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{signal.reasoning}</p>

            <div className="flex flex-wrap gap-1">
              {signal.sources.slice(0, 3).map((source, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No signals match your criteria. Try lowering the confidence threshold.
        </div>
      )}
    </div>
  );
}
