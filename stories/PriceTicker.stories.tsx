import type { Meta, StoryObj } from '@storybook/react';

/**
 * PriceTicker is an **async server component** that fetches live crypto prices
 * from CoinGecko and renders a scrolling ticker bar.
 *
 * Since it uses server-side data fetching, the stories below use a static
 * client-side replica to demonstrate the visual states.
 */

interface TickerCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

function PriceTickerMock({ coins, fearGreedValue, className = '' }: { coins: TickerCoin[]; fearGreedValue?: number; className?: string }) {
  return (
    <div
      className={`bg-black text-white py-1.5 border-b border-gray-800 overflow-hidden ${className}`}
      role="region"
      aria-label="Cryptocurrency prices"
    >
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center gap-4 text-[13px] overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-700 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide" role="list">
            {coins.map((coin) => {
              const isPositive = (coin.change || 0) >= 0;
              return (
                <span key={coin.symbol} className="flex items-center gap-1.5 whitespace-nowrap" role="listitem">
                  <span className="text-gray-500 font-semibold">{coin.symbol}USD</span>
                  <span className="font-bold text-white tabular-nums">{formatPrice(coin.price)}</span>
                  <span className={`text-xs font-semibold tabular-nums ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{coin.change?.toFixed(2)}%
                  </span>
                </span>
              );
            })}
          </div>
          {fearGreedValue !== undefined && (
            <div className="flex items-center gap-2 whitespace-nowrap border-l border-gray-700 pl-4 ml-auto flex-shrink-0">
              <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">F&amp;G</span>
              <span className={`font-bold text-sm ${fearGreedValue >= 75 ? 'text-green-400' : fearGreedValue >= 50 ? 'text-yellow-400' : fearGreedValue >= 25 ? 'text-orange-400' : 'text-red-400'}`}>
                {fearGreedValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const bullishCoins: TickerCoin[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 104250, change: 3.42 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3895, change: 5.18 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 198.5, change: 8.21 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 625, change: 1.75 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 2.45, change: 4.33 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.892, change: 6.12 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.324, change: 12.5 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 8.75, change: 2.84 },
  { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', price: 42.3, change: 7.65 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 18.9, change: 3.91 },
];

const meta: Meta<typeof PriceTickerMock> = {
  title: 'Components/PriceTicker',
  component: PriceTickerMock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BullishMarket: Story = {
  args: { coins: bullishCoins, fearGreedValue: 82 },
};

export const BearishMarket: Story = {
  args: {
    coins: bullishCoins.map((c) => ({ ...c, change: -(Math.random() * 8 + 1) })),
    fearGreedValue: 18,
  },
};

export const NeutralMarket: Story = {
  args: {
    coins: bullishCoins.map((c, i) => ({ ...c, change: i % 2 === 0 ? 0.45 : -0.32 })),
    fearGreedValue: 50,
  },
};

export const WithoutFearGreed: Story = {
  args: { coins: bullishCoins.slice(0, 5) },
};
