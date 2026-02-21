/**
 * SentimentMeter - Visual gradient bar showing article sentiment
 * Replaces the simple text badge with an interactive gauge
 */

'use client';

interface SentimentMeterProps {
  score: number;       // 0 (bearish) to 1 (bullish)
  label: string;       // e.g. "positive", "very_negative"
  confidence: number;  // 0-1
}

const labelDisplay: Record<string, string> = {
  very_positive: 'Very Bullish',
  positive: 'Bullish',
  neutral: 'Neutral',
  negative: 'Bearish',
  very_negative: 'Very Bearish',
};

export default function SentimentMeter({ score, label, confidence }: SentimentMeterProps) {
  const displayLabel = labelDisplay[label] || label;
  const percentage = Math.round(score * 100);
  const confidencePct = Math.round(confidence * 100);

  // Determine color for the marker
  const markerColor = score > 0.6
    ? 'bg-green-500 shadow-green-500/40'
    : score < 0.4
      ? 'bg-red-500 shadow-red-500/40'
      : 'bg-yellow-500 shadow-yellow-500/40';

  const textColor = score > 0.6
    ? 'text-green-600 dark:text-green-400'
    : score < 0.4
      ? 'text-red-600 dark:text-red-400'
      : 'text-yellow-600 dark:text-yellow-400';

  return (
    <div className="w-full">
      {/* Gradient bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
        {/* Marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${markerColor} shadow-lg transition-all duration-500`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>

      {/* Labels below bar */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-red-500 dark:text-red-400 font-medium">Bearish</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${textColor}`}>
            {displayLabel}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            ({confidencePct}% confidence)
          </span>
        </div>
        <span className="text-xs text-green-500 dark:text-green-400 font-medium">Bullish</span>
      </div>
    </div>
  );
}
