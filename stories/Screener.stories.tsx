import type { Meta, StoryObj } from '@storybook/react';
import { Screener } from '../src/components/Screener';

function makeCoin(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'bitcoin', symbol: 'btc', name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    current_price: 104250, market_cap: 2.04e12, market_cap_rank: 1,
    total_volume: 48.5e9, price_change_percentage_24h: 3.42,
    price_change_percentage_7d_in_currency: 8.15,
    price_change_percentage_30d_in_currency: 15.6,
    ath: 109000, ath_change_percentage: -4.36,
    circulating_supply: 19580000, total_supply: 21000000,
    ...overrides,
  };
}

const mockCoins = [
  makeCoin(),
  makeCoin({ id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', current_price: 3895, market_cap: 469e9, market_cap_rank: 2, total_volume: 22e9, price_change_percentage_24h: 5.18, ath: 4878, ath_change_percentage: -20.1 }),
  makeCoin({ id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', current_price: 198, market_cap: 92e9, market_cap_rank: 4, total_volume: 6.2e9, price_change_percentage_24h: 8.21, ath: 260, ath_change_percentage: -23.8 }),
  makeCoin({ id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', current_price: 625, market_cap: 95e9, market_cap_rank: 3, total_volume: 2.1e9, price_change_percentage_24h: 1.75, ath: 720, ath_change_percentage: -13.2 }),
  makeCoin({ id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', current_price: 2.45, market_cap: 141e9, market_cap_rank: 5, total_volume: 8.9e9, price_change_percentage_24h: 4.33, ath: 3.84, ath_change_percentage: -36.2 }),
  makeCoin({ id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', current_price: 0.892, market_cap: 31.5e9, market_cap_rank: 8, total_volume: 1.2e9, price_change_percentage_24h: 6.12, ath: 3.09, ath_change_percentage: -71.1 }),
  makeCoin({ id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', current_price: 0.324, market_cap: 47.8e9, market_cap_rank: 7, total_volume: 3.8e9, price_change_percentage_24h: 12.5, ath: 0.7376, ath_change_percentage: -56.1 }),
  makeCoin({ id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', current_price: 8.75, market_cap: 12.4e9, market_cap_rank: 14, total_volume: 520e6, price_change_percentage_24h: -2.84, ath: 55, ath_change_percentage: -84.1 }),
  makeCoin({ id: 'avalanche', symbol: 'avax', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', current_price: 42.3, market_cap: 17.3e9, market_cap_rank: 11, total_volume: 890e6, price_change_percentage_24h: -1.65, ath: 146, ath_change_percentage: -71.0 }),
  makeCoin({ id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', current_price: 18.9, market_cap: 12e9, market_cap_rank: 15, total_volume: 780e6, price_change_percentage_24h: 3.91, ath: 52.7, ath_change_percentage: -64.1 }),
];

const meta: Meta<typeof Screener> = {
  title: 'Components/Screener',
  component: Screener,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { coins: mockCoins } };
export const FewCoins: Story = { args: { coins: mockCoins.slice(0, 3) } };
export const Empty: Story = { args: { coins: [] } };
