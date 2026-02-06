/**
 * TechnicalAnalysis - Comprehensive technical indicators card for coin detail page
 * Computes RSI, MACD, Bollinger Bands, Stochastic, ADX from OHLC data
 */

'use client';

import { useMemo } from 'react';
import type { OHLCData } from '@/lib/market-data';
import {
  rsi,
  macd,
  bollingerBands,
  stochastic,
  adx,
  generateSignals,
  calculateOverallSignal,
  type OHLCV,
  type TechnicalSignal,
} from '@/lib/technical-indicators';

interface TechnicalAnalysisProps {
  ohlcData: OHLCData[];
  symbol: string;
  currentPrice: number;
}

function toOHLCV(data: OHLCData[]): OHLCV[] {
  return data.map(d => ({
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: 0,
    timestamp: d.timestamp,
  }));
}

const signalColors = {
  buy: 'text-green-400',
  sell: 'text-red-400',
  neutral: 'text-gray-400',
};

const signalBgColors = {
  buy: 'bg-green-500/10 border-green-500/20',
  sell: 'bg-red-500/10 border-red-500/20',
  neutral: 'bg-gray-500/10 border-gray-500/20',
};

const signalLabels = {
  buy: 'Buy',
  sell: 'Sell',
  neutral: 'Neutral',
};

function OverallBadge({ signal, confidence }: { signal: 'buy' | 'sell' | 'neutral'; confidence: number }) {
  const configs = {
    buy: {
      label: confidence > 0.6 ? 'Strong Buy' : 'Buy',
      bg: 'bg-green-500/20 border-green-500/40',
      text: 'text-green-400',
      glow: 'shadow-green-500/10',
    },
    sell: {
      label: confidence > 0.6 ? 'Strong Sell' : 'Sell',
      bg: 'bg-red-500/20 border-red-500/40',
      text: 'text-red-400',
      glow: 'shadow-red-500/10',
    },
    neutral: {
      label: 'Neutral',
      bg: 'bg-gray-500/20 border-gray-500/40',
      text: 'text-gray-300',
      glow: 'shadow-gray-500/10',
    },
  };

  const cfg = configs[signal];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${cfg.bg} ${cfg.glow} shadow-lg`}>
      <span className={`text-lg font-bold ${cfg.text}`}>{cfg.label}</span>
      <span className="text-xs text-gray-400">
        ({Math.round(confidence * 100)}% confidence)
      </span>
    </div>
  );
}

function IndicatorRow({ label, value, interpretation, signal }: {
  label: string;
  value: string;
  interpretation: string;
  signal: 'buy' | 'sell' | 'neutral';
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700/30 last:border-0">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <p className="text-xs text-gray-500 mt-0.5">{interpretation}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-sm font-mono text-gray-300">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${signalBgColors[signal]} ${signalColors[signal]} border`}>
          {signalLabels[signal]}
        </span>
      </div>
    </div>
  );
}

export default function TechnicalAnalysis({ ohlcData, symbol, currentPrice }: TechnicalAnalysisProps) {
  const analysis = useMemo(() => {
    if (ohlcData.length < 15) return null;

    const candles = toOHLCV(ohlcData);
    const prices = ohlcData.map(d => d.close);

    // Core indicators
    const rsiVal = rsi(prices, 14);
    const macdData = macd(prices, 12, 26, 9);
    const bbData = bollingerBands(prices, 20, 2);
    const stochData = stochastic(candles, 14, 3);
    const adxVal = adx(candles, 14);

    // Signals
    const signals = generateSignals(prices, candles);
    const overall = calculateOverallSignal(signals);

    return {
      rsi: rsiVal,
      macd: macdData,
      bb: bbData,
      stoch: stochData,
      adx: adxVal,
      signals,
      overall,
    };
  }, [ohlcData]);

  if (!analysis) {
    return (
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">📊 Technical Analysis</h3>
        <p className="text-gray-400 text-sm">Not enough data for technical analysis. At least 15 data points required.</p>
      </div>
    );
  }

  const { rsi: rsiVal, macd: macdData, bb: bbData, stoch: stochData, adx: adxVal, signals, overall } = analysis;

  // RSI interpretation
  const rsiSignal: 'buy' | 'sell' | 'neutral' = rsiVal < 30 ? 'buy' : rsiVal > 70 ? 'sell' : 'neutral';
  const rsiInterp = rsiVal < 30 ? 'Oversold — potential bounce' : rsiVal > 70 ? 'Overbought — potential pullback' : 'Neutral range';

  // MACD interpretation
  const macdSignal: 'buy' | 'sell' | 'neutral' = macdData.histogram > 0 ? 'buy' : macdData.histogram < 0 ? 'sell' : 'neutral';
  const macdInterp = macdData.histogram > 0 ? 'Bullish momentum' : macdData.histogram < 0 ? 'Bearish momentum' : 'No clear direction';

  // Bollinger interpretation
  const bbSignal: 'buy' | 'sell' | 'neutral' = currentPrice < bbData.lower ? 'buy' : currentPrice > bbData.upper ? 'sell' : 'neutral';
  const bbInterp = currentPrice < bbData.lower ? 'Below lower band — oversold'
    : currentPrice > bbData.upper ? 'Above upper band — overbought'
    : `Price at ${(bbData.percentB * 100).toFixed(0)}% of band width`;

  // Stochastic interpretation
  const stochSignal: 'buy' | 'sell' | 'neutral' = stochData.k < 20 ? 'buy' : stochData.k > 80 ? 'sell' : 'neutral';
  const stochInterp = stochData.k < 20 ? 'Oversold territory' : stochData.k > 80 ? 'Overbought territory' : 'Normal range';

  // ADX interpretation
  const adxInterp = adxVal > 25 ? 'Strong trend' : adxVal > 20 ? 'Moderate trend' : 'Weak/no trend';

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          📊 Technical Analysis
        </h3>
        <OverallBadge signal={overall.signal} confidence={overall.confidence} />
      </div>

      {/* Signal summary bar */}
      <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-gray-900/50">
        {(() => {
          const buys = signals.filter(s => s.signal === 'buy').length;
          const sells = signals.filter(s => s.signal === 'sell').length;
          const neutrals = signals.filter(s => s.signal === 'neutral').length;
          return (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-green-400 font-medium">{buys} Buy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-400 font-medium">{neutrals} Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm text-red-400 font-medium">{sells} Sell</span>
              </div>
            </>
          );
        })()}
      </div>

      {/* Oscillators Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Oscillators</h4>
        <div className="bg-gray-900/30 rounded-xl px-4 py-1">
          <IndicatorRow
            label="RSI (14)"
            value={rsiVal.toFixed(1)}
            interpretation={rsiInterp}
            signal={rsiSignal}
          />
          <IndicatorRow
            label="Stochastic %K / %D"
            value={`${stochData.k.toFixed(1)} / ${stochData.d.toFixed(1)}`}
            interpretation={stochInterp}
            signal={stochSignal}
          />
          <IndicatorRow
            label="MACD Histogram"
            value={macdData.histogram.toFixed(4)}
            interpretation={macdInterp}
            signal={macdSignal}
          />
        </div>
      </div>

      {/* Trend & Volatility Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Trend & Volatility</h4>
        <div className="bg-gray-900/30 rounded-xl px-4 py-1">
          <IndicatorRow
            label="Bollinger Bands"
            value={`${bbData.lower.toFixed(2)} — ${bbData.upper.toFixed(2)}`}
            interpretation={bbInterp}
            signal={bbSignal}
          />
          <IndicatorRow
            label="ADX (14)"
            value={adxVal.toFixed(1)}
            interpretation={adxInterp}
            signal={adxVal > 25 ? (overall.signal === 'sell' ? 'sell' : 'buy') : 'neutral'}
          />
          <IndicatorRow
            label="BB Bandwidth"
            value={`${bbData.bandwidth.toFixed(2)}%`}
            interpretation={bbData.bandwidth > 10 ? 'High volatility' : bbData.bandwidth < 3 ? 'Low volatility — squeeze' : 'Normal volatility'}
            signal="neutral"
          />
        </div>
      </div>

      {/* Individual Signals */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Signal Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {signals.map((sig) => (
            <div
              key={sig.indicator}
              className={`flex items-center justify-between p-3 rounded-lg border ${signalBgColors[sig.signal]}`}
            >
              <span className="text-sm text-gray-300">{sig.indicator}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${signalColors[sig.signal]}`}>
                  {signalLabels[sig.signal]}
                </span>
                <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sig.signal === 'buy' ? 'bg-green-400' : sig.signal === 'sell' ? 'bg-red-400' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.round(sig.strength * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-4">
        Based on 30-day price data. Not financial advice. Indicators may lag and should be combined with fundamental analysis.
      </p>
    </div>
  );
}
