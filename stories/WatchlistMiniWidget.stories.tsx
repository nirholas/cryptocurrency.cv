import type { Meta, StoryObj } from '@storybook/react';
import { WatchlistMiniWidget } from '../src/components/watchlist/WatchlistMiniWidget';
import { WatchlistProvider } from '../src/components/watchlist/WatchlistProvider';

const mockCoins = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 104250, change24h: 3.42, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3895, change24h: 5.18, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 198, change24h: 8.21, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.324, change24h: 12.5, image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 18.9, change24h: -2.84, image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.892, change24h: -1.2, image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
];

const meta: Meta<typeof WatchlistMiniWidget> = {
  title: 'Components/WatchlistMiniWidget',
  component: WatchlistMiniWidget,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story: React.ComponentType) => (
      <WatchlistProvider>
        <div className="w-80">
          <Story />
        </div>
      </WatchlistProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCoins: Story = { args: { coins: mockCoins, maxItems: 5 } };
export const LimitedItems: Story = { args: { coins: mockCoins, maxItems: 3 } };
export const EmptyWatchlist: Story = { args: { coins: [] } };
export const SingleCoin: Story = { args: { coins: [mockCoins[0]], maxItems: 5 } };
export const BearishCoins: Story = {
  args: {
    coins: mockCoins.map((c) => ({ ...c, change24h: -(Math.abs(c.change24h) + 2) })),
    maxItems: 5,
  },
};
