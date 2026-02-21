'use client';

import { useState } from 'react';
import { useAIStream } from '@/hooks/useAIStream';

const PRESET_TOPICS = [
  { label: 'Bitcoin', value: 'Bitcoin BTC' },
  { label: 'Ethereum', value: 'Ethereum ETH' },
  { label: 'Solana', value: 'Solana SOL' },
  { label: 'DeFi', value: 'DeFi decentralized finance' },
  { label: 'Regulation', value: 'crypto regulation SEC CFTC' },
  { label: 'ETFs', value: 'Bitcoin Ethereum ETF spot' },
  { label: 'AI + Crypto', value: 'AI artificial intelligence crypto' },
  { label: 'Stablecoins', value: 'stablecoin USDT USDC' },
];

export function AITopicDigest() {
  const [topic, setTopic] = useState('');
  const [lastTopic, setLastTopic] = useState('');
  const { text, loading, done, error, start, reset } = useAIStream();

  const runDigest = (selectedTopic: string) => {
    if (!selectedTopic.trim() || loading) return;
    const t = selectedTopic.trim();
    setLastTopic(t);
    reset();
    start(`/api/ai/digest?topic=${encodeURIComponent(t)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runDigest(topic);
  };

  const hasOutput = !!text;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🧠</span>
          <h3 className="text-base font-bold text-white">AI Topic Digest</h3>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            LIVE
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Pick a topic and get an AI-written narrative analysis from today&apos;s news.
        </p>
      </div>

      {/* Topic input + presets */}
      <div className="px-5 py-4 border-b border-slate-700/60">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Enter a topic, e.g. 'Bitcoin ETF' or 'DeFi hacks'"
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-amber-400/60 transition"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!topic.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 flex-shrink-0"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Writing…
              </>
            ) : (
              'Digest'
            )}
          </button>
        </form>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TOPICS.map(p => (
            <button
              key={p.value}
              onClick={() => {
                setTopic(p.value);
                runDigest(p.value);
              }}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-white transition border border-slate-600/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div className="px-5 py-4 min-h-[80px]">
        {error && (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {!hasOutput && !loading && !error && (
          <p className="text-slate-500 text-sm text-center py-4">
            Select a topic above to generate your AI digest
          </p>
        )}

        {hasOutput && (
          <>
            {lastTopic && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-400">Digest for:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  {lastTopic}
                </span>
                {done && (
                  <button
                    onClick={() => runDigest(lastTopic)}
                    className="ml-auto text-xs text-slate-400 hover:text-white transition"
                    disabled={loading}
                  >
                    ↺ Refresh
                  </button>
                )}
              </div>
            )}
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed">
              {/* Render markdown-like content: split on ## headers */}
              {text.split(/^(##[^\n]*)/m).map((segment, i) => {
                if (segment.startsWith('## ')) {
                  return (
                    <h4 key={i} className="text-sm font-bold text-white mt-4 mb-1.5 first:mt-0">
                      {segment.slice(3).trim()}
                    </h4>
                  );
                }
                return (
                  <p key={i} className="text-sm text-slate-300 whitespace-pre-wrap mb-2">
                    {segment}
                  </p>
                );
              })}
              {loading && (
                <span className="animate-pulse text-amber-400 ml-0.5">▌</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
