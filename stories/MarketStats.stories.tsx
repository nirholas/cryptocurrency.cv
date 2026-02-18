import type { Meta, StoryObj } from '@storybook/react';

/**
 * MarketStats is an **async server component** that fetches market overview data.
 * The stories below use a static client-side replica for visual testing.
 */

const formatNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(2)}`;
};

const formatPercent = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

interface MarketStatsMockProps {
  totalMarketCap: number;
  marketCapChange: number;
  btcDominance: number;
  totalVolume: number;
  fearGreedValue: number;
  fearGreedLabel: string;
  topCoins: Array<{ name: string; symbol: string; price: number; change: number; image: string }>;
}

function MarketStatsMock({
  totalMarketCap, marketCapChange, btcDominance, totalVolume,
  fearGreedValue, fearGreedLabel, topCoins,
}: MarketStatsMockProps) {
  const isPositive = marketCapChange >= 0;
  const fgColor = fearGreedValue >= 75 ? 'text-green-400' : fearGreedValue >= 50 ? 'text-yellow-400' : fearGreedValue >= 25 ? 'text-orange-400' : 'text-red-400';
  const fgBg = fearGreedValue >= 75 ? 'bg-green-900/40' : fearGreedValue >= 50 ? 'bg-yellow-900/40' : fearGreedValue >= 25 ? 'bg-orange-900/40' : 'bg-red-900/40';

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 rounded-2xl shadow-xl dark:border dark:border-slate-700/50 backdrop-blur-sm max-w-md">
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(245,158,11,0.4) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.3) 0%, transparent 50%)' }} aria-hidden="true" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-500 flex items-center justify-center shadow-lg">📊</span>
            Market Overview
          </h3>
        </div>
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Total Market Cap</span>
                <div className="text-xl font-bold text-white mt-1">{formatNumber(totalMarketCap)}</div>
              </div>
              <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full ${isPositive ? 'text-emerald-400 bg-emerald-900/40' : 'text-red-400 bg-red-900/40'}`}>
                {formatPercent(marketCapChange)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">24h Volume</span>
              <div className="text-lg font-bold text-white mt-1">{formatNumber(totalVolume)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">BTC Dominance</span>
              <div className="text-lg font-bold text-white mt-1">{btcDominance.toFixed(1)}%</div>
            </div>
          </div>
          <div className={`rounded-xl p-4 border border-slate-700/50 ${fgBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">Fear &amp; Greed Index</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${fgColor}`}>{fearGreedValue}</span>
                <span className={`text-sm font-semibold ${fgColor}`}>{fearGreedLabel}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {topCoins.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{coin.image}</span>
                  <span className="font-semibold text-white text-sm">{coin.name}</span>
                  <span className="text-slate-500 text-xs">{coin.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-white">{formatNumber(coin.price)}</div>
                  <div className={`text-xs ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(coin.change)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultTopCoins = [
  { name: 'Bitcoin', symbol: 'BTC', price: 104250, change: 3.42, image: '₿' },
  { name: 'Ethereum', symbol: 'ETH', price: 3895, change: 5.18, image: 'Ξ' },
  { name: 'Solana', symbol: 'SOL', price: 198, change: 8.21, image: '◎' },
];

const meta: Meta<typeof MarketStatsMock> = {
  title: 'Components/MarketStats',
  component: MarketStatsMock,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BullishMarket: Story = {
  args: { totalMarketCap: 3.72e12, marketCapChange: 2.85, btcDominance: 54.3, totalVolume: 142e9, fearGreedValue: 78, fearGreedLabel: 'Extreme Greed', topCoins: defaultTopCoins },
};

export const BearishMarket: Story = {
  args: { totalMarketCap: 2.1e12, marketCapChange: -5.42, btcDominance: 62.1, totalVolume: 89e9, fearGreedValue: 15, fearGreedLabel: 'Extreme Fear', topCoins: defaultTopCoins.map((c) => ({ ...c, change: -Math.abs(c.change) })) },
};

export const NeutralMarket: Story = {
  args: { totalMarketCap: 2.8e12, marketCapChange: 0.32, btcDominance: 48.7, totalVolume: 110e9, fearGreedValue: 50, fearGreedLabel: 'Neutral', topCoins: defaultTopCoins.map((c, i) => ({ ...c, change: i % 2 === 0 ? 0.5 : -0.8 })) },
};
