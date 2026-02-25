/**
 * AICommentaryStream — Real-time AI Market Commentary
 *
 * Live, streaming market commentary powered by AI. Displays a Bloomberg-style
 * feed of AI-generated insights, alerts, and predictions that update in real-time.
 *
 * Uses SSE (Server-Sent Events) to stream commentary from /api/commentary.
 *
 * @module components/AICommentaryStream
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommentaryTone = 'anchor' | 'analyst' | 'trader' | 'degen';
type CommentaryUrgency = 'flash' | 'breaking' | 'developing' | 'routine';

interface CommentaryEvent {
  id: string;
  timestamp: string;
  type: 'commentary' | 'alert' | 'insight' | 'prediction' | 'recap';
  urgency: CommentaryUrgency;
  tone: CommentaryTone;
  headline: string;
  body: string;
  sources: string[];
  tickers: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  confidence: number;
  tags: string[];
}

interface MarketSnapshot {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  totalMarketCap: number;
  fearGreed: number;
  fearGreedLabel: string;
  topMovers: { name: string; symbol: string; change: number }[];
}

// ---------------------------------------------------------------------------
// Styling Maps
// ---------------------------------------------------------------------------

const urgencyStyles: Record<CommentaryUrgency, { bg: string; border: string; badge: string; pulse: boolean }> = {
  flash: { bg: 'bg-red-500/10 dark:bg-red-500/20', border: 'border-red-500/50', badge: 'bg-red-500 text-white', pulse: true },
  breaking: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', border: 'border-amber-500/40', badge: 'bg-amber-500 text-black', pulse: true },
  developing: { bg: 'bg-blue-500/10 dark:bg-blue-500/15', border: 'border-blue-500/30', badge: 'bg-blue-500 text-white', pulse: false },
  routine: { bg: 'bg-gray-500/5 dark:bg-gray-500/10', border: 'border-gray-500/20', badge: 'bg-gray-500 text-white', pulse: false },
};

const typeIcons: Record<string, string> = {
  commentary: '📡',
  alert: '🚨',
  insight: '💡',
  prediction: '🔮',
  recap: '📊',
};

const sentimentColors: Record<string, string> = {
  bullish: 'text-emerald-500',
  bearish: 'text-red-500',
  neutral: 'text-gray-400',
  mixed: 'text-amber-500',
};

const toneLabels: Record<CommentaryTone, { label: string; emoji: string }> = {
  anchor: { label: 'News Anchor', emoji: '🎙️' },
  analyst: { label: 'Market Analyst', emoji: '📈' },
  trader: { label: 'Pro Trader', emoji: '⚡' },
  degen: { label: 'Crypto Native', emoji: '🦍' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AICommentaryStreamProps {
  defaultTone?: CommentaryTone;
  autoStart?: boolean;
  maxEvents?: number;
  showSnapshot?: boolean;
  compact?: boolean;
}

export function AICommentaryStream({
  defaultTone = 'anchor',
  autoStart = true,
  maxEvents = 50,
  showSnapshot = true,
  compact = false,
}: AICommentaryStreamProps) {
  const [events, setEvents] = useState<CommentaryEvent[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [tone, setTone] = useState<CommentaryTone>(defaultTone);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(autoStart);
  const eventSourceRef = useRef<EventSource | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('common');

  const startStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    setIsStreaming(true);

    const es = new EventSource(`/api/commentary?tone=${tone}&interval=60`);
    eventSourceRef.current = es;

    es.addEventListener('commentary', (e) => {
      try {
        const event: CommentaryEvent = JSON.parse(e.data);
        setEvents(prev => {
          // Deduplicate by id
          if (prev.some(p => p.id === event.id)) return prev;
          return [event, ...prev].slice(0, maxEvents);
        });
      } catch (err) {
        console.error('[Commentary] Parse error:', err);
      }
    });

    es.addEventListener('snapshot', (e) => {
      try {
        setSnapshot(JSON.parse(e.data));
      } catch { /* ignore */ }
    });

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data || '{}');
        setError(data.error || 'Stream error');
      } catch {
        // EventSource reconnects automatically
      }
    });

    es.onerror = () => {
      setIsStreaming(false);
      // EventSource auto-reconnects, don't show error for transient issues
    };

    es.onopen = () => {
      setIsStreaming(true);
      setError(null);
    };
  }, [tone, maxEvents]);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (isLive) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [isLive, startStream, stopStream]);

  // When tone changes, restart stream
  useEffect(() => {
    if (isLive) {
      stopStream();
      startStream();
    }
  }, [tone, isLive, stopStream, startStream]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${isStreaming ? 'animate-pulse' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500' : 'bg-gray-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                {isStreaming ? 'LIVE' : 'OFF'}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">AI Commentary</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {toneLabels[tone].emoji} {toneLabels[tone].label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tone selector */}
            <select
              value={tone}
              onChange={e => setTone(e.target.value as CommentaryTone)}
              className="text-xs bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
            >
              {Object.entries(toneLabels).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>
                  {emoji} {label}
                </option>
              ))}
            </select>

            {/* Play/Pause */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                isLive
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {isLive ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Market Snapshot Bar */}
      {showSnapshot && snapshot && (
        <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-4 overflow-x-auto text-xs">
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            BTC ${snapshot.btcPrice.toLocaleString()}
            <span className={snapshot.btcChange24h >= 0 ? 'text-emerald-500 ml-1' : 'text-red-500 ml-1'}>
              {snapshot.btcChange24h >= 0 ? '+' : ''}{snapshot.btcChange24h.toFixed(2)}%
            </span>
          </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            ETH ${snapshot.ethPrice.toLocaleString()}
            <span className={snapshot.ethChange24h >= 0 ? 'text-emerald-500 ml-1' : 'text-red-500 ml-1'}>
              {snapshot.ethChange24h >= 0 ? '+' : ''}{snapshot.ethChange24h.toFixed(2)}%
            </span>
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            F&G: <span className="font-semibold">{snapshot.fearGreed}</span> ({snapshot.fearGreedLabel})
          </span>
        </div>
      )}

      {/* Commentary Feed */}
      <div ref={feedRef} className={`overflow-y-auto ${compact ? 'max-h-[400px]' : 'max-h-[600px]'}`}>
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {events.length === 0 && !error && (
          <div className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
            {isLive ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">AI is analyzing the market...</span>
              </div>
            ) : (
              <span className="text-sm">Press ▶ Start to begin live commentary</span>
            )}
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {events.map(event => {
            const style = urgencyStyles[event.urgency];
            return (
              <div
                key={event.id}
                className={`px-4 py-3 ${style.bg} border-l-2 ${style.border} transition-all duration-500 animate-in slide-in-from-top-2`}
              >
                {/* Top row: urgency badge + type + time */}
                <div className="flex items-center gap-2 mb-1.5">
                  {event.urgency !== 'routine' && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${style.badge} ${style.pulse ? 'animate-pulse' : ''}`}>
                      {event.urgency}
                    </span>
                  )}
                  <span className="text-sm">{typeIcons[event.type]}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {event.tickers.slice(0, 3).map(ticker => (
                      <span key={ticker} className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded">
                        ${ticker}
                      </span>
                    ))}
                    <span className={`text-xs font-semibold ${sentimentColors[event.sentiment]}`}>
                      {event.sentiment === 'bullish' ? '▲' : event.sentiment === 'bearish' ? '▼' : '●'} {event.sentiment}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Headline */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1">
                  {event.headline}
                </h4>

                {/* Body */}
                {!compact && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {event.body}
                  </p>
                )}

                {/* Confidence bar */}
                {event.type === 'prediction' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Confidence:</span>
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${event.confidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{event.confidence}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          ⚠️ AI-generated commentary. Not financial advice.
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {events.length} events
        </span>
      </div>
    </div>
  );
}

export default AICommentaryStream;
