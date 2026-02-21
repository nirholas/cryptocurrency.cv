import type { Meta, StoryObj } from '@storybook/react';
import { CryptoCalculator } from '../src/components/CryptoCalculator';

/**
 * CryptoCalculator is an interactive swap/profit calculator.
 * It can work on a provided coin list or falls back to fetching prices
 * from CoinGecko at runtime.
 */

const mockCoins = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png', current_price: 97000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png', current_price: 3200 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png', current_price: 185 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png', current_price: 2.1 },
];

const meta: Meta<typeof CryptoCalculator> = {
  title: 'Components/CryptoCalculator',
  component: CryptoCalculator,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { coins: mockCoins },
};

export const WithManyCoins: Story = {
  args: {
    coins: [
      ...mockCoins,
      { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: '', current_price: 0.35 },
      { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: '', current_price: 0.55 },
    ],
  },
};

export const DarkBackground: Story = {
  args: { coins: mockCoins },
  parameters: { backgrounds: { default: 'dark' } },
};

export const LightBackground: Story = {
  args: { coins: mockCoins },
  parameters: { backgrounds: { default: 'light' } },
};
