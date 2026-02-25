'use client';

/**
 * AI Chart Analyzer
 *
 * Upload a chart screenshot or analyze a coin's OHLC data using
 * vision AI (Gemini / Claude / GPT-4V). Detects patterns, support/resistance,
 * Fibonacci levels, volume profile, and provides trading signals.
 *
 * @component AIChartAnalyzer
 */

import React, { useCallback, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChartPattern {
  name: string;
  type: string;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget?: number;
  description: string;
}

interface SupportResistance {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
}

interface ChartAnalysis {
  symbol: string;
  timeframe: string;
  provider: string;
  timestamp: string;
  patterns: ChartPattern[];
  trend: { direction: string; strength: number; description: string };
  supportResistance: SupportResistance[];
  fibonacciLevels?: Record<string, number>;
  volumeProfile?: { trend: string; significance: string; description: string };
  signals: { type: string; confidence: number; description: string; timeframe: string }[];
  riskReward?: { ratio: number; entry: number; stopLoss: number; takeProfit: number };
  summary: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Pattern badge colors
// ---------------------------------------------------------------------------

const DIRECTION_STYLES = {
  bullish: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  bearish: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  neutral: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIChartAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'ohlc'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // OHLC mode inputs
  const [symbol, setSymbol] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState('1d');
  const [days, setDays] = useState(30);

  // Upload mode
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);

    // Send to API
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const base64Reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        base64Reader.onload = () => {
          const base64 = (base64Reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      base64Reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const res = await fetch('/api/chart-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type || 'image/png',
          symbol: symbol || undefined,
          timeframe: timeframe || undefined,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // OHLC mode
  const handleOHLCAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    setPreview(null);

    try {
      const res = await fetch(
        `/api/chart-analysis?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&days=${days}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Chart Analysis</h2>
            <p className="text-xs text-white/40">Vision AI pattern recognition & technical analysis</p>
          </div>
        </div>
        <div className="flex rounded-lg bg-white/5 p-0.5">
          {(['upload', 'ohlc'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {m === 'upload' ? '📷 Upload Chart' : '📊 OHLC Data'}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-b border-white/10 p-4">
        {mode === 'upload' ? (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
              dragOver ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            {preview ? (
              <img src={preview} alt="Chart preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <svg className="mb-2 h-8 w-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-white/40">Drop a chart screenshot or click to upload</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2 text-xs text-white/40 file:mr-2 file:rounded-full file:border-0 file:bg-cyan-600 file:px-3 file:py-1 file:text-xs file:text-white"
            />
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="Symbol (optional)"
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none"
              />
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="1m">1 min</option>
                <option value="5m">5 min</option>
                <option value="15m">15 min</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
                <option value="1w">1 week</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="ohlc-coin-id" className="mb-1 block text-[10px] text-white/40">Coin ID</label>
              <input
                id="ohlc-coin-id"
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="bitcoin"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ohlc-timeframe" className="mb-1 block text-[10px] text-white/40">Timeframe</label>
              <select
                id="ohlc-timeframe"
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="1h">Hourly</option>
                <option value="1d">Daily</option>
                <option value="1w">Weekly</option>
              </select>
            </div>
            <div>
              <label htmlFor="ohlc-days" className="mb-1 block text-[10px] text-white/40">Days</label>
              <input
                id="ohlc-days"
                type="number"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                min={7}
                max={365}
                className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={handleOHLCAnalysis}
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : '🔍 Analyze'}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Analyzing with vision AI...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 px-4 py-2 text-xs text-red-300">{error}</div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-0 divide-y divide-white/5">
          {/* Summary */}
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-white">{analysis.symbol?.toUpperCase()}</span>
              <span className="text-[10px] text-white/30">{analysis.timeframe}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                via {analysis.provider}
              </span>
              <span className="ml-auto text-[10px] text-white/20">
                {Math.round(analysis.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">{analysis.summary}</p>
          </div>

          {/* Trend */}
          {analysis.trend && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Trend</h4>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  analysis.trend.direction === 'up' || analysis.trend.direction === 'bullish'
                    ? 'text-green-400'
                    : analysis.trend.direction === 'down' || analysis.trend.direction === 'bearish'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {analysis.trend.direction === 'up' || analysis.trend.direction === 'bullish'
                    ? '↗ Bullish'
                    : analysis.trend.direction === 'down' || analysis.trend.direction === 'bearish'
                    ? '↘ Bearish'
                    : '→ Sideways'}
                </span>
                <div className="h-1.5 w-24 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${analysis.trend.strength * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30">{Math.round(analysis.trend.strength * 100)}%</span>
              </div>
              {analysis.trend.description && (
                <p className="mt-1 text-xs text-white/40">{analysis.trend.description}</p>
              )}
            </div>
          )}

          {/* Patterns */}
          {analysis.patterns?.length > 0 && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Detected Patterns</h4>
              <div className="space-y-2">
                {analysis.patterns.map((p, i) => {
                  const style = DIRECTION_STYLES[p.direction] || DIRECTION_STYLES.neutral;
                  return (
                    <div key={i} className={`rounded-lg border ${style.border} ${style.bg} px-3 py-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${style.text}`}>{p.name}</span>
                        <span className="text-[10px] text-white/30">{Math.round(p.confidence * 100)}% conf</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-white/50">{p.description}</p>
                      {p.priceTarget && (
                        <p className="mt-0.5 text-[10px] text-white/30">Target: ${p.priceTarget.toLocaleString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Support / Resistance */}
          {analysis.supportResistance?.length > 0 && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
                Support &amp; Resistance
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {analysis.supportResistance.map((sr, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 ${
                      sr.type === 'support' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${sr.type === 'support' ? 'text-green-400' : 'text-red-400'}`}>
                        ${sr.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-white/30">{sr.touches} touches</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${sr.type === 'support' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${sr.strength * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk/Reward */}
          {analysis.riskReward && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Risk / Reward</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-white/5 px-2 py-2">
                  <p className="text-[10px] text-white/30">Ratio</p>
                  <p className="text-sm font-bold text-cyan-400">{analysis.riskReward.ratio.toFixed(1)}:1</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2 py-2">
                  <p className="text-[10px] text-white/30">Entry</p>
                  <p className="text-xs text-white">${analysis.riskReward.entry.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-green-500/10 px-2 py-2">
                  <p className="text-[10px] text-green-400/60">Take Profit</p>
                  <p className="text-xs text-green-400">${analysis.riskReward.takeProfit.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-red-500/10 px-2 py-2">
                  <p className="text-[10px] text-red-400/60">Stop Loss</p>
                  <p className="text-xs text-red-400">${analysis.riskReward.stopLoss.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Signals */}
          {analysis.signals?.length > 0 && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Trading Signals</h4>
              <div className="space-y-1">
                {analysis.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                    <span className={`text-xs font-medium ${
                      s.type === 'buy' ? 'text-green-400' : s.type === 'sell' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {s.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/50">{s.description}</span>
                    <span className="ml-auto text-[10px] text-white/20">{Math.round(s.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fibonacci */}
          {analysis.fibonacciLevels && Object.keys(analysis.fibonacciLevels).length > 0 && (
            <div className="p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Fibonacci Levels</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.fibonacciLevels).map(([level, price]) => (
                  <div key={level} className="rounded-lg bg-white/5 px-2 py-1 text-center">
                    <p className="text-[10px] text-white/30">{level}</p>
                    <p className="text-xs text-white">${Number(price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
