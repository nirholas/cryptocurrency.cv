import type { Meta, StoryObj } from '@storybook/react';
import { DominanceChart } from '../src/components/DominanceChart';

const mockCoins = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', market_cap: 1_950_000_000_000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', market_cap: 380_000_000_000 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', market_cap: 130_000_000_000 },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', market_cap: 92_000_000_000 },
  { id: 'solana', symbol: 'sol', name: 'Solana', market_cap: 78_000_000_000 },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', market_cap: 67_000_000_000 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', market_cap: 22_000_000_000 },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', market_cap: 19_000_000_000 },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', market_cap: 14_000_000_000 },
  { id: 'avalanche', symbol: 'avax', name: 'Avalanche', market_cap: 12_000_000_000 },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', market_cap: 9_000_000_000 },
  { id: 'polygon', symbol: 'matic', name: 'Polygon', market_cap: 7_000_000_000 },
];

const bitcoinDominantCoins = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', market_cap: 1_950_000_000_000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', market_cap: 150_000_000_000 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', market_cap: 50_000_000_000 },
];

const meta: Meta<typeof DominanceChart> = {
  title: 'Components/DominanceChart',
  component: DominanceChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DominanceChart>;

export const Default: Story = {
  args: {
    coins: mockCoins,
  },
};

export const BitcoinDominant: Story = {
  name: 'Bitcoin dominant (3 coins)',
  args: {
    coins: bitcoinDominantCoins,
  },
};

export const NoData: Story = {
  name: 'Empty (no coins)',
  args: {
    coins: [],
  },
};

export const DarkBackground: Story = {
  args: {
    coins: mockCoins,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
