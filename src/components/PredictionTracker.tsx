'use client';

/**
 * PredictionTracker
 *
 * Displays a leaderboard of AI-generated daily crypto price predictions
 * with accuracy scoring and a 30-day sparkline.
 *
 * Data source: GET /api/predictions/history
 */

import { useEffect, useState } from 'react';
import type { PredictionHistoryResponse, CoinAccuracy } from '@/app/api/predictions/history/route';

/** Prediction and result types (defined locally since cron route may not exist) */
interface AIPrediction {
  coin: string;
  direction: string;
  confidence: number;
  currentPrice?: number;
  predictedPrice24h?: number;
  predictedPrice7d?: number;
  [key: string]: unknown;
}

interface ScoredResult {
  coin: string;
  direction_correct: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

interface SparklineProps {
  data: (boolean | null)[];
  width?: number;
  height?: number;
}

function Sparkline({ data, width = 120, height = 24 }: SparklineProps) {
  const n = data.length;
  if (n === 0) return null;

  const dotR = 3;
  const padding = dotR + 1;
  const innerW = width - padding * 2;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      className="inline-block align-middle"
    >
      {data.map((v, i) => {
        const cx = n === 1 ? width / 2 : padding + (i / (n - 1)) * innerW;
        if (v === null) {
          return (
            <circle key={i} cx={cx} cy={cy} r={dotR} fill="currentColor" className="text-gray-300 dark:text-gray-600" />
          );
        }
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={dotR}
            fill={v ? '#22c55e' : '#ef4444'}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(p: number): string {
  if (p >= 1000) {
    return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function pctChange(current: number, predicted: number): string {
  const pct = ((predicted - current) / current) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface RowData {
  prediction: AIPrediction;
  latestResult: ScoredResult | null;
  accuracy: CoinAccuracy | undefined;
}

function PredictionRow({ prediction, latestResult, accuracy }: RowData) {
  const isCorrect = latestResult?.direction_correct;
  const hasResult = latestResult !== null;

  const rowBg = hasResult
    ? isCorrect
      ? 'bg-green-50 dark:bg-green-950/30'
      : 'bg-red-50 dark:bg-red-950/30'
    : '';

  const accuracyPct = accuracy?.accuracy_pct ?? 0;

  return (
    <tr className={`border-b border-gray-100 dark:border-gray-800 ${rowBg} transition-colors`}>
      {/* Coin */}
      <td className="py-3 px-4 font-semibold text-sm whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasResult ? (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
              title={isCorrect ? 'Last prediction: correct direction' : 'Last prediction: wrong direction'}
            />
          ) : (
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600" title="Not yet scored" />
          )}
          {prediction.coin}
        </div>
      </td>

      {/* Current price */}
      <td className="py-3 px-4 text-sm tabular-nums text-right">
        {formatPrice(prediction.current_price)}
      </td>

      {/* 24h prediction */}
      <td className="py-3 px-4 text-sm tabular-nums text-right">
        <span className={prediction.predicted_24h >= prediction.current_price ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {formatPrice(prediction.predicted_24h)}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          ({pctChange(prediction.current_price, prediction.predicted_24h)})
        </span>
      </td>

      {/* 7d prediction */}
      <td className="py-3 px-4 text-sm tabular-nums text-right">
        <span className={prediction.predicted_7d >= prediction.current_price ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {formatPrice(prediction.predicted_7d)}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          ({pctChange(prediction.current_price, prediction.predicted_7d)})
        </span>
      </td>

      {/* 7d accuracy */}
      <td className="py-3 px-4 text-sm text-right tabular-nums">
        {accuracy && accuracy.total > 0 ? (
          <span className={`font-medium ${accuracyPct >= 60 ? 'text-green-600 dark:text-green-400' : accuracyPct >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {accuracyPct}%
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
        {accuracy && accuracy.total > 0 && (
          <span className="text-xs text-gray-400 ml-1">({accuracy.correct}/{accuracy.total})</span>
        )}
      </td>

      {/* Sparkline */}
      <td className="py-3 px-4 text-right">
        {accuracy ? (
          <Sparkline data={accuracy.sparkline} />
        ) : (
          <span className="text-gray-400 text-xs">no data</span>
        )}
      </td>

      {/* Confidence */}
      <td className="py-3 px-4 text-sm text-right text-gray-500">
        {Math.round(prediction.confidence * 100)}%
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Reasoning drawer
// ---------------------------------------------------------------------------

interface ReasoningPanelProps {
  predictions: AIPrediction[];
}

function ReasoningPanel({ predictions }: ReasoningPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
        aria-expanded={open}
      >
        {open ? '▲ Hide AI reasoning' : '▼ Show AI reasoning'}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {predictions.map(p => (
            <li key={p.coin} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{p.coin}:</span>{' '}
              {p.reasoning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PredictionTracker() {
  const [data, setData] = useState<PredictionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/predictions/history')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PredictionHistoryResponse>;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-950/30 rounded">
        Failed to load predictions: {error}
      </div>
    );
  }

  const latest = data?.latest;

  if (!latest || latest.predictions.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
        <p className="font-medium mb-1">No AI predictions yet.</p>
        <p>The daily cron job will populate predictions at midnight UTC.</p>
        <p className="mt-2 text-xs text-gray-400">
          ⚠️ AI predictions are for entertainment only and do not constitute financial advice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            AI Prediction Tracker
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Daily AI price predictions with self-scoring accuracy
          </p>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Date: {latest.date} &nbsp;·&nbsp; Model: {latest.predictions[0]?.model ?? '—'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="py-2.5 px-4 font-semibold">Coin</th>
              <th className="py-2.5 px-4 font-semibold text-right">Current</th>
              <th className="py-2.5 px-4 font-semibold text-right">24h Pred.</th>
              <th className="py-2.5 px-4 font-semibold text-right">7d Pred.</th>
              <th className="py-2.5 px-4 font-semibold text-right">30d Accuracy</th>
              <th className="py-2.5 px-4 font-semibold text-right">Sparkline</th>
              <th className="py-2.5 px-4 font-semibold text-right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {latest.predictions.map((pred: AIPrediction) => (
              <PredictionRow
                key={pred.coin}
                prediction={pred}
                latestResult={
                  latest.results?.find(r => r.coin === pred.coin) ?? null
                }
                accuracy={data?.accuracy[pred.coin]}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* AI reasoning */}
      <ReasoningPanel predictions={latest.predictions} />

      {/* Disclaimer */}
      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
        ⚠️ <strong>Disclaimer:</strong> AI predictions are generated for entertainment purposes only and do not constitute financial advice. Never invest based on AI forecasts alone.
      </p>
    </div>
  );
}
