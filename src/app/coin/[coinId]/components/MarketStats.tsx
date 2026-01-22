/**
 * MarketStats Component - Market cap, volume, supply grid with tooltips
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketStatsProps {
  marketCap: number;
  marketCapRank: number | null;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  fullyDilutedValuation: number | null;
  symbol: string;
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return '∞';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatSupply(num: number | null | undefined, symbol: string): string {
  if (num == null) return '∞';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B ' + symbol;
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M ' + symbol;
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K ' + symbol;
  return num.toFixed(0) + ' ' + symbol;
}

interface TooltipInfo {
  title: string;
  description: string;
}

const tooltipContent: Record<string, TooltipInfo> = {
  marketCap: {
    title: 'Market Cap',
    description: 'Total market value of circulating supply. Calculated by multiplying current price by circulating supply.',
  },
  volume: {
    title: '24h Volume',
    description: 'Total value of the cryptocurrency traded in the last 24 hours across all exchanges.',
  },
  circulatingSupply: {
    title: 'Circulating Supply',
    description: 'The number of coins that are publicly available and circulating in the market.',
  },
  maxSupply: {
    title: 'Max Supply',
    description: 'The maximum number of coins that will ever exist. Some cryptocurrencies have no maximum supply cap.',
  },
  fdv: {
    title: 'Fully Diluted Valuation',
    description: 'Market cap if the max supply was in circulation. Calculated by multiplying current price by max supply.',
  },
  volumeMcap: {
    title: 'Volume / Market Cap',
    description: 'Ratio of 24h trading volume to market cap. Higher ratios may indicate more trading activity relative to size.',
  },
};

function InfoTooltip({ id }: { id: string }) {
  const [show, setShow] = useState(false);
  const content = tooltipContent[id];

  if (!content) return null;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-500 hover:text-gray-400 transition-colors"
        aria-label={`Info about ${content.title}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 rounded-lg shadow-xl border border-gray-700"
          >
            <h4 className="text-sm font-semibold text-white mb-1">{content.title}</h4>
            <p className="text-xs text-gray-400">{content.description}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 -translate-y-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  badge?: string | number;
  progress?: number;
  tooltipId?: string;
}

function StatCard({ label, value, subValue, badge, progress, tooltipId }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
        {tooltipId && <InfoTooltip id={tooltipId} />}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-white">${value}</span>
        {badge && (
          <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs font-medium rounded">
            #{badge}
          </span>
        )}
      </div>

      {subValue && (
        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
      )}

      {typeof progress === 'number' && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% of max</p>
        </div>
      )}
    </motion.div>
  );
}

export default function MarketStats({
  marketCap,
  marketCapRank,
  volume24h,
  circulatingSupply,
  totalSupply,
  maxSupply,
  fullyDilutedValuation,
  symbol,
}: MarketStatsProps) {
  const volumeToMcap = marketCap > 0 ? (volume24h / marketCap) * 100 : 0;
  const circulatingPercent = maxSupply ? (circulatingSupply / maxSupply) * 100 : null;
  const symbolUpper = symbol.toUpperCase();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Market Cap */}
      <StatCard
        label="Market Cap"
        value={formatNumber(marketCap)}
        badge={marketCapRank || undefined}
        tooltipId="marketCap"
      />

      {/* 24h Volume */}
      <StatCard
        label="24h Volume"
        value={formatNumber(volume24h)}
        subValue={`Vol/MCap: ${volumeToMcap.toFixed(2)}%`}
        tooltipId="volume"
      />

      {/* Circulating Supply */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Circulating Supply</span>
          <InfoTooltip id="circulatingSupply" />
        </div>
        
        <span className="text-xl font-bold text-white">
          {formatSupply(circulatingSupply, symbolUpper)}
        </span>

        {circulatingPercent !== null && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, circulatingPercent)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {circulatingPercent.toFixed(1)}% of max supply
            </p>
          </div>
        )}
      </motion.div>

      {/* Max Supply / FDV */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Max Supply</span>
          <InfoTooltip id="maxSupply" />
        </div>
        
        <span className="text-xl font-bold text-white">
          {maxSupply ? formatSupply(maxSupply, symbolUpper) : '∞'}
        </span>

        {fullyDilutedValuation && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">FDV:</span>
              <span className="text-xs text-gray-400">${formatNumber(fullyDilutedValuation)}</span>
              <InfoTooltip id="fdv" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
