'use client';

import { useState, useEffect, useCallback } from 'react';

interface PredictionOption {
  label: string;
  votes: number;
}

interface Prediction {
  id: string;
  question: string;
  options: PredictionOption[];
  totalVotes: number;
  expiresAt: string;
}

interface PredictionPollProps {
  coinId?: string;
}

export function PredictionPoll({ coinId }: PredictionPollProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Fallback poll for when API has no predictions
  const [fallbackVote, setFallbackVote] = useState<'bullish' | 'bearish' | null>(null);

  const storageKey = prediction ? `prediction-vote-${prediction.id}` : '';

  const fetchPrediction = useCallback(async () => {
    try {
      const url = coinId ? `/api/predictions?coin=${coinId}&limit=1` : '/api/predictions?limit=1';
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const result = await res.json();
      const predictions = result.predictions || [];
      if (predictions.length > 0) {
        const p = predictions[0];
        setPrediction({
          id: p.id,
          question: p.question,
          options: (p.options || []).map((o: Record<string, unknown>) => ({
            label: (o.label as string) || '',
            votes: Number(o.votes || 0),
          })),
          totalVotes: Number(p.totalVotes || 0),
          expiresAt: (p.expiresAt as string) || '',
        });

        // Check localStorage for prior vote
        const saved = localStorage.getItem(`prediction-vote-${p.id}`);
        if (saved !== null) {
          setVotedIndex(parseInt(saved, 10));
          setShowResults(true);
        }
      }
    } catch {
      // Silently fail — show fallback
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  // Countdown timer
  useEffect(() => {
    if (!prediction?.expiresAt) return;
    const tick = () => {
      const diff = new Date(prediction.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Ended');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 24) {
        setCountdown(`${Math.floor(h / 24)}d ${h % 24}h`);
      } else {
        setCountdown(`${h}h ${m}m`);
      }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [prediction]);

  const handleVote = async (index: number) => {
    if (votedIndex !== null || !prediction) return;

    // Optimistic update
    setVotedIndex(index);
    setShowResults(true);
    const updated = { ...prediction };
    updated.options = updated.options.map((o, i) =>
      i === index ? { ...o, votes: o.votes + 1 } : o
    );
    updated.totalVotes += 1;
    setPrediction(updated);

    localStorage.setItem(storageKey, String(index));

    try {
      await fetch('/api/predictions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId: prediction.id, optionIndex: index }),
      });
    } catch {
      // Already optimistically updated
    }
  };

  const handleFallbackVote = (vote: 'bullish' | 'bearish') => {
    setFallbackVote(vote);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
          <div className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
        </div>
      </div>
    );
  }

  // Fallback: simple bullish/bearish toggle
  if (!prediction) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
          <div className="flex items-center gap-2">
            <span>🔮</span>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Your Outlook</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
            What&apos;s your market outlook{coinId ? ` for ${coinId}` : ''}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFallbackVote('bullish')}
              disabled={fallbackVote !== null}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fallbackVote === 'bullish'
                  ? 'bg-green-500 text-white scale-105'
                  : fallbackVote !== null
                  ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
              }`}
            >
              🚀 Bullish
            </button>
            <button
              onClick={() => handleFallbackVote('bearish')}
              disabled={fallbackVote !== null}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fallbackVote === 'bearish'
                  ? 'bg-red-500 text-white scale-105'
                  : fallbackVote !== null
                  ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
              }`}
            >
              📉 Bearish
            </button>
          </div>
          {fallbackVote && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-slate-400">
              Thanks! You voted {fallbackVote === 'bullish' ? '🚀 Bullish' : '📉 Bearish'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔮</span>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Prediction</h3>
          </div>
          {countdown && (
            <span className="text-xs text-gray-500 dark:text-slate-400">⏱ {countdown}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{prediction.question}</p>

        <div className="space-y-2">
          {prediction.options.map((option, i) => {
            const pct = prediction.totalVotes > 0 ? (option.votes / prediction.totalVotes) * 100 : 0;
            const isVoted = votedIndex === i;

            return (
              <button
                key={i}
                onClick={() => handleVote(i)}
                disabled={showResults}
                className={`w-full relative overflow-hidden rounded-xl text-left transition-all ${
                  showResults
                    ? 'cursor-default'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 active:scale-[0.98]'
                } ${isVoted ? 'ring-2 ring-brand-500 dark:ring-amber-400' : ''}`}
              >
                {/* Background bar */}
                {showResults && (
                  <div
                    className={`absolute inset-0 rounded-xl transition-all duration-700 ${
                      isVoted ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-slate-700/30'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl">
                  <span className={`text-sm font-medium ${isVoted ? 'text-brand-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    {option.label}
                    {isVoted && ' ✓'}
                  </span>
                  {showResults && (
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{pct.toFixed(0)}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResults && (
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-slate-400">
            {prediction.totalVotes.toLocaleString()} votes
          </p>
        )}
      </div>
    </div>
  );
}
